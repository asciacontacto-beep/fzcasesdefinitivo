// Cálculo del pedido y armado del mensaje de WhatsApp.
// Lo usan el servidor (para validar y guardar el pedido) y el navegador (para
// mostrar el resumen), así los dos calculan exactamente lo mismo.

import { transferPrice } from "./shop-defaults";
import type { DeliveryOption, ShopSettings } from "./types";

export type PaymentMethod = "transferencia" | "efectivo" | "mercadopago";

export interface CheckoutCustomer {
  nombre: string;
  telefono: string;
  email?: string;
  dni?: string;
}

export interface CheckoutAddress {
  calle: string;
  ciudad: string;
  provincia: string;
  cp: string;
}

export interface CheckoutLine {
  id: number;
  name: string;
  color: string;
  qty: number;
  priceUsd: number;
}

export interface CheckoutTotals {
  subtotalUsd: number;
  subtotalArs: number;
  discountArs: number;
  shippingArs: number;
  totalArs: number;
  rate: number;
}

export function computeTotals(
  lines: Pick<CheckoutLine, "qty" | "priceUsd">[],
  shop: Pick<ShopSettings, "usdRate" | "transferDiscountPct">,
  method: PaymentMethod,
  delivery: DeliveryOption | undefined,
): CheckoutTotals {
  const subtotalUsd = lines.reduce((n, l) => n + l.qty * l.priceUsd, 0);
  const subtotalArs = Math.round(subtotalUsd * shop.usdRate);
  const discountArs = method === "transferencia" ? subtotalArs - transferPrice(subtotalArs, shop.transferDiscountPct) : 0;
  const shippingArs = delivery?.priceArs ?? 0;
  return { subtotalUsd, subtotalArs, discountArs, shippingArs, totalArs: subtotalArs - discountArs + shippingArs, rate: shop.usdRate };
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  transferencia: "Transferencia",
  efectivo: "Efectivo al retirar",
  mercadopago: "Mercado Pago",
};

const ars = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

/** Mensaje que le llega a la tienda por WhatsApp. Escrito como lo escribiría el cliente. */
export function buildOrderMessage(p: {
  numero: number | null;
  lines: CheckoutLine[];
  totals: CheckoutTotals;
  method: PaymentMethod;
  discountPct: number;
  delivery: DeliveryOption | undefined;
  address: CheckoutAddress | null;
  customer: CheckoutCustomer;
  notes: string;
}) {
  const out: string[] = [];
  out.push(p.numero ? `Hola FZCASES! Les hago el pedido #${p.numero} desde la web:` : "Hola FZCASES! Les hago este pedido desde la web:");
  out.push("");
  for (const l of p.lines) out.push(`- ${l.qty} x ${l.name}${l.color ? ` (${l.color})` : ""}`);
  out.push("");
  if (p.method === "transferencia" && p.totals.discountArs > 0) {
    out.push(`Total: ${ars(p.totals.totalArs)} pagando por transferencia (${p.discountPct}% off, sin descuento eran ${ars(p.totals.subtotalArs + p.totals.shippingArs)})`);
  } else {
    out.push(`Total: ${ars(p.totals.totalArs)}`);
  }
  out.push(`Pago: ${PAYMENT_LABEL[p.method]}`);
  out.push(`Entrega: ${p.delivery?.label ?? "a coordinar"}${p.delivery?.needsAddress && !p.totals.shippingArs ? " (costo de envío a coordinar)" : ""}`);
  if (p.address) out.push(`Dirección: ${[p.address.calle, p.address.ciudad, p.address.provincia, p.address.cp && `CP ${p.address.cp}`].filter(Boolean).join(", ")}`);
  out.push("");
  out.push(`Nombre: ${p.customer.nombre}`);
  out.push(`Tel: ${p.customer.telefono}`);
  if (p.customer.email) out.push(`Mail: ${p.customer.email}`);
  if (p.notes.trim()) {
    out.push("");
    out.push(`Nota: ${p.notes.trim()}`);
  }
  return out.join("\n");
}
