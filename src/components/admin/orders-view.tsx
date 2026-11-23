"use client";
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { mutate } from "swr";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useOrders } from "@/lib/admin/data";
import { revalidateStore } from "@/lib/admin/revalidate";
import type { OrderRow, OrderStatus, PaymentStatus } from "@/lib/types";
import { formatArs, formatUsd, waLink } from "@/lib/format";
import { normalizePath } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { Card, Dialog, Empty, Notice, PageTitle, Pill, Segmented } from "./ui";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "ink" }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  pagado: { label: "Pagado", tone: "success" },
  preparando: { label: "Preparando", tone: "neutral" },
  listo: { label: "Listo para entregar", tone: "ink" },
  entregado: { label: "Entregado", tone: "neutral" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

const PAY_STATUS: Record<PaymentStatus, string> = {
  pendiente: "Pago pendiente",
  aprobado: "Pago aprobado",
  rechazado: "Pago rechazado",
  reembolsado: "Reembolsado",
  a_coordinar: "Pago a coordinar",
};

type Filter = "abiertos" | "todos" | "entregado" | "cancelado";
const OPEN: OrderStatus[] = ["pendiente", "pagado", "preparando", "listo"];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function OrdersView() {
  const { data, isLoading } = useOrders();
  const [filter, setFilter] = useState<Filter>("abiertos");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    if (!data) return [];
    if (filter === "abiertos") return data.filter((o) => OPEN.includes(o.estado));
    if (filter === "todos") return data;
    return data.filter((o) => o.estado === filter);
  }, [data, filter]);
  const current = data?.find((o) => o.id === openId) ?? null;

  if (data === null) {
    return (
      <>
        <PageTitle title="Pedidos" />
        <Notice>
          La tabla de pedidos todavía no existe. Corré <code>supabase/migrations/20261123_001_ecommerce.sql</code> en el SQL Editor de Supabase y esta pantalla empieza a funcionar.
        </Notice>
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Pedidos"
        subtitle={data ? `${data.filter((o) => OPEN.includes(o.estado)).length} abiertos` : undefined}
        actions={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "abiertos", label: "Abiertos" },
              { value: "entregado", label: "Entregados" },
              { value: "cancelado", label: "Cancelados" },
              { value: "todos", label: "Todos" },
            ]}
          />
        }
      />
      <Card>
        {isLoading ? (
          <div className="space-y-px p-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-[10px]" />)}</div>
        ) : list.length === 0 ? (
          <Empty title="No hay pedidos acá" text="Cuando alguien compre accesorios desde la tienda, el pedido aparece en esta lista." />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((o) => (
              <li key={o.id}>
                <button onClick={() => setOpenId(o.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-alt md:grid-cols-[80px_1fr_140px_150px_170px]">
                  <span className="hidden text-[15px] font-medium md:block">#{o.numero}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium">{o.cliente_nombre}</span>
                    <span className="block truncate text-[13px] text-muted">
                      <span className="md:hidden">#{o.numero} · </span>
                      {fmtDate(o.created_at)} · {o.order_items?.reduce((n, i) => n + i.cantidad, 0) ?? 0} productos
                    </span>
                  </span>
                  <span className="hidden text-right text-[15px] md:block">{formatArs(o.total_ars)}</span>
                  <span className="hidden text-[13px] text-ink-soft md:block">{o.metodo_pago === "mercadopago" ? "Mercado Pago" : "WhatsApp"} · {PAY_STATUS[o.pago_estado]}</span>
                  <span className="justify-self-end"><Pill tone={ORDER_STATUS[o.estado].tone}>{ORDER_STATUS[o.estado].label}</Pill></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <OrderDialog order={current} onClose={() => setOpenId(null)} />
    </>
  );
}

function OrderDialog({ order, onClose }: { order: OrderRow | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  if (!order) return null;

  const setStatus = async (estado: OrderStatus) => {
    setBusy(true);
    const { error } = await supabaseBrowser().from("orders").update({ estado, updated_at: new Date().toISOString() }).eq("id", order.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Pedido #${order.numero}: ${ORDER_STATUS[estado].label.toLowerCase()}`);
    void mutate("admin/orders");
  };

  const markPaid = async () => {
    setBusy(true);
    const { error } = await supabaseBrowser().rpc("confirmar_pago_pedido", { p_order: order.id, p_payment_id: null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Pago registrado: se descontó el stock y se cargó la venta");
    void Promise.all([mutate("admin/orders"), mutate("admin/products"), mutate("admin/sales"), revalidateStore(["catalog"])]);
  };

  const phone = order.cliente_telefono.replace(/[^\d]/g, "");
  const dir = order.direccion;

  return (
    <Dialog open onClose={onClose} title={`Pedido #${order.numero}`} wide>
      <div className="grid gap-8 md:grid-cols-[1fr_260px]">
        <div>
          <ul className="divide-y divide-line rounded-[12px] border border-line">
            {order.order_items?.map((it) => (
              <li key={it.id} className="flex items-center gap-4 p-3">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-alt">
                  {it.imagen && <img src={normalizePath(it.imagen)} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{it.nombre}</span>
                  <span className="block text-[13px] text-muted">{[it.color, `${it.cantidad} × ${formatUsd(it.precio_usd)}`].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="text-[15px]">{formatUsd(it.precio_usd * it.cantidad)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 text-[15px]">
            <Row label="Subtotal" value={formatUsd(order.subtotal_usd)} />
            <Row label="Cotización" value={`${formatArs(order.cotizacion)} por dólar`} />
            {order.envio_ars > 0 && <Row label="Envío" value={formatArs(order.envio_ars)} />}
            <Row label="Total" value={formatArs(order.total_ars)} strong />
          </dl>
          {order.notas && <p className="mt-4 rounded-[12px] bg-alt p-3 text-[15px] text-ink-soft">“{order.notas}”</p>}
        </div>

        <div className="space-y-6 text-[15px]">
          <div>
            <p className="mb-1 text-[13px] font-medium text-muted">Cliente</p>
            <p className="font-medium">{order.cliente_nombre}</p>
            <p className="text-ink-soft">{order.cliente_telefono}</p>
            {order.cliente_email && <p className="text-ink-soft">{order.cliente_email}</p>}
            {order.cliente_dni && <p className="text-ink-soft">DNI {order.cliente_dni}</p>}
            <a href={waLink(phone, `Hola ${order.cliente_nombre.split(" ")[0]}, te escribimos de FZCASES por tu pedido #${order.numero}.`)} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 font-medium">
              <MessageCircle size={15} /> <span className="link-draw">Escribirle por WhatsApp</span>
            </a>
          </div>
          <div>
            <p className="mb-1 text-[13px] font-medium text-muted">Entrega</p>
            <p>{order.entrega.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}</p>
            {dir && <p className="text-ink-soft">{[dir.calle, dir.ciudad, dir.provincia, dir.cp].filter(Boolean).join(", ")}</p>}
          </div>
          <div>
            <p className="mb-1 text-[13px] font-medium text-muted">Pago</p>
            <p>{order.metodo_pago === "mercadopago" ? "Mercado Pago" : "Coordinado por WhatsApp"}</p>
            <p className="text-ink-soft">{PAY_STATUS[order.pago_estado]}{order.mp_payment_id && ` · ${order.mp_payment_id}`}</p>
            {order.pago_estado !== "aprobado" && order.estado !== "cancelado" && (
              <Button variant="secondary" className="mt-3 w-full" onClick={markPaid} disabled={busy}>Marcar como pagado</Button>
            )}
          </div>
          <div>
            <label htmlFor="order-status" className="mb-1 block text-[13px] font-medium text-muted">Estado del pedido</label>
            <select id="order-status" value={order.estado} onChange={(e) => setStatus(e.target.value as OrderStatus)} disabled={busy} className="input">
              {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-line pt-2 font-medium" : "text-ink-soft"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
