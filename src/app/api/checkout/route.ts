// POST /api/checkout
//
// Recibe el carrito y los datos del cliente, vuelve a calcular todo con los
// precios y el stock reales de la base (nunca confía en lo que manda el
// navegador), guarda el pedido si hay service role configurada y devuelve el
// mensaje listo para mandar por WhatsApp.
import { z } from "zod";
import { getProducts, getShopSettings } from "@/lib/catalog";
import { rest, supabaseAdmin } from "@/lib/supabase/server";
import { buildOrderMessage, computeTotals, type CheckoutLine } from "@/lib/checkout";
import { waLink } from "@/lib/format";

const Body = z.object({
  lines: z.array(z.object({ id: z.number().int().positive(), qty: z.number().int().min(1).max(20) })).min(1).max(30),
  method: z.enum(["transferencia", "efectivo", "mercadopago"]),
  deliveryId: z.string().min(1),
  customer: z.object({
    nombre: z.string().trim().min(2).max(80),
    telefono: z.string().trim().min(6).max(30),
    email: z.string().trim().email().max(120).optional().or(z.literal("")),
    dni: z.string().trim().max(15).optional().or(z.literal("")),
  }),
  address: z
    .object({ calle: z.string().trim().max(120), ciudad: z.string().trim().max(80), provincia: z.string().trim().max(60), cp: z.string().trim().max(10) })
    .nullable(),
  notes: z.string().max(500).default(""),
});

interface StockRow {
  id: number;
  nombre: string;
  color: string | null;
  precio_venta: number | null;
  stock: number | null;
  activo: boolean | string | null;
}

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Revisá los datos del formulario.");
  const body = parsed.data;

  const [shop, catalog] = await Promise.all([getShopSettings(), getProducts()]);

  // Forma de pago habilitada
  if (body.method === "mercadopago") return fail("El pago con Mercado Pago todavía no está disponible.");
  if (body.method === "transferencia" && !shop.transferEnabled) return fail("El pago por transferencia no está disponible.");
  if (body.method === "efectivo" && !shop.whatsappCheckoutEnabled) return fail("El pago en efectivo no está disponible.");

  const delivery = shop.deliveryOptions.find((d) => d.id === body.deliveryId);
  if (!delivery) return fail("Elegí una forma de entrega.");
  if (delivery.needsAddress && (!body.address?.calle || !body.address.ciudad)) return fail("Completá la dirección de envío.");

  // Precio y stock frescos (el catálogo en caché puede tener hasta una hora)
  const ids = [...new Set(body.lines.map((l) => l.id))];
  let fresh: StockRow[];
  try {
    fresh = await rest<StockRow[]>(`products?select=id,nombre,color,precio_venta,stock,activo&id=in.(${ids.join(",")})`);
  } catch {
    return fail("No pudimos verificar el stock. Probá de nuevo en un momento.", 503);
  }

  const lines: (CheckoutLine & { image: string | null })[] = [];
  for (const l of body.lines) {
    const row = fresh.find((r) => r.id === l.id);
    const listed = catalog.find((p) => p.id === l.id);
    const price = Number(row?.precio_venta) || 0;
    if (!row || !listed || !(row.activo === true || row.activo === "true") || !listed.sellOnline || price <= 0) {
      return fail(`${listed?.name ?? "Un producto"} ya no se puede comprar online. Sacalo del carrito y probá de nuevo.`, 409);
    }
    if ((row.stock ?? 0) < l.qty) {
      return fail(`De ${row.nombre} quedan ${row.stock ?? 0}. Ajustá la cantidad.`, 409);
    }
    lines.push({ id: row.id, name: row.nombre, color: row.color ?? "", qty: l.qty, priceUsd: price, image: listed.image });
  }

  const totals = computeTotals(lines, shop, body.method, delivery);
  const address = delivery.needsAddress ? body.address : null;
  const customer = { nombre: body.customer.nombre, telefono: body.customer.telefono, email: body.customer.email || undefined, dni: body.customer.dni || undefined };

  // Guardar el pedido (si hay service role). Si no, igual sale por WhatsApp.
  let numero: number | null = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      numero = await saveOrder({ body, lines, totals, delivery: delivery.id, address, customer });
    } catch (e) {
      console.error("[checkout] no se pudo guardar el pedido:", e);
    }
  }

  const message = buildOrderMessage({
    numero,
    lines,
    totals,
    method: body.method,
    discountPct: shop.transferDiscountPct,
    delivery,
    address,
    customer,
    notes: body.notes,
  });

  return Response.json({
    numero,
    totals,
    method: body.method,
    waUrl: waLink(shop.whatsapp, message),
    bank: body.method === "transferencia" ? shop.bank : null,
    discountPct: shop.transferDiscountPct,
  });
}

async function saveOrder(p: {
  body: z.infer<typeof Body>;
  lines: (CheckoutLine & { image: string | null })[];
  totals: ReturnType<typeof computeTotals>;
  delivery: string;
  address: z.infer<typeof Body>["address"];
  customer: { nombre: string; telefono: string; email?: string; dni?: string };
}): Promise<number> {
  const db = supabaseAdmin();
  const order = {
    metodo_pago: p.body.method === "transferencia" ? "transferencia" : "whatsapp",
    pago_estado: p.body.method === "transferencia" ? "pendiente" : "a_coordinar",
    cliente_nombre: p.customer.nombre,
    cliente_telefono: p.customer.telefono,
    cliente_email: p.customer.email ?? null,
    cliente_dni: p.customer.dni ?? null,
    entrega: p.delivery,
    direccion: p.address,
    notas: p.body.notes.trim() || null,
    subtotal_usd: p.totals.subtotalUsd,
    cotizacion: p.totals.rate,
    envio_ars: p.totals.shippingArs,
    total_ars: p.totals.totalArs,
    descuento_ars: p.totals.discountArs,
  };

  let res = await db.from("orders").insert(order).select("id,numero").single();
  // Sin la migración 002 no existe "transferencia" ni descuento_ars: se guarda igual
  if (res.error && /check|descuento_ars/i.test(res.error.message)) {
    const { descuento_ars: _d, ...legacy } = order;
    void _d;
    res = await db
      .from("orders")
      .insert({ ...legacy, metodo_pago: "whatsapp", notas: [`[${p.body.method === "transferencia" ? "Transferencia" : "Efectivo"}]`, order.notas].filter(Boolean).join(" ") })
      .select("id,numero")
      .single();
  }
  if (res.error) throw res.error;

  const items = p.lines.map((l) => ({
    order_id: res.data.id,
    producto_id: l.id,
    nombre: l.name,
    color: l.color || null,
    imagen: l.image && !l.image.startsWith("/api/") ? l.image : null,
    cantidad: l.qty,
    precio_usd: l.priceUsd,
  }));
  const { error } = await db.from("order_items").insert(items);
  if (error) throw error;
  return res.data.numero as number;
}
