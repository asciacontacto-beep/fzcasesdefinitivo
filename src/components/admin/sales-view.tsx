"use client";
import { useMemo, useState } from "react";
import { mutate } from "swr";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { SYSTEM_NAMES, useProducts, useSales, type SaleRow } from "@/lib/admin/data";
import { formatUsd } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, Dialog, Empty, Field, PageTitle } from "./ui";

const METHODS = ["Efectivo", "Transferencia", "MercadoPago", "Mercado Pago (web)", "Web / WhatsApp"];

const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  const t = new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export function SalesView() {
  const { data: sales, isLoading } = useSales();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<SaleRow | null>(null);

  const months = useMemo(() => {
    const s = new Set((sales ?? []).map((x) => monthKey(x.fecha)));
    s.add(new Date().toISOString().slice(0, 7));
    return [...s].sort().reverse();
  }, [sales]);
  const list = useMemo(() => (sales ?? []).filter((s) => monthKey(s.fecha) === month), [sales, month]);
  const totals = list.reduce(
    (t, s) => ({ units: t.units + s.cantidad, revenue: t.revenue + s.precio_final * s.cantidad, cost: t.cost + (s.precio_costo || 0) * s.cantidad }),
    { units: 0, revenue: 0, cost: 0 },
  );

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabaseBrowser().from("sales").delete().eq("id", toDelete.id);
    if (error) return toast.error(error.message);
    toast.success("Venta eliminada");
    setToDelete(null);
    void mutate("admin/sales");
  };

  return (
    <>
      <PageTitle
        title="Ventas"
        subtitle="Ventas registradas a mano y las de la tienda online."
        actions={
          <>
            <select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Mes" className="input w-auto">
              {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
            <Button onClick={() => setCreating(true)}><Plus size={16} /> Registrar venta</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-4">
        <Stat label="Ventas" value={String(list.length)} />
        <Stat label="Unidades" value={String(totals.units)} />
        <Stat label="Facturado" value={formatUsd(totals.revenue)} />
        <Stat label="Ganancia" value={formatUsd(totals.revenue - totals.cost)} />
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-px p-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-[10px]" />)}</div>
        ) : list.length === 0 ? (
          <Empty title={`Sin ventas en ${monthLabel(month).toLowerCase()}`} action={<Button variant="secondary" onClick={() => setCreating(true)}>Registrar una venta</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[15px]">
              <thead>
                <tr className="border-b border-line text-left text-[13px] text-muted">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Producto</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Pago</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-right font-medium">Ganancia</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((s) => (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-ink-soft">{new Date(s.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</td>
                    <td className="px-5 py-3">{s.producto_nombre}{s.cantidad > 1 && <span className="text-muted"> × {s.cantidad}</span>}</td>
                    <td className="px-5 py-3 text-ink-soft">{s.cliente || "—"}</td>
                    <td className="px-5 py-3 text-ink-soft">{s.metodo_pago || "—"}</td>
                    <td className="px-5 py-3 text-right">{formatUsd(s.precio_final * s.cantidad)}</td>
                    <td className="px-5 py-3 text-right text-ink-soft">{s.precio_costo ? formatUsd((s.precio_final - s.precio_costo) * s.cantidad) : "—"}</td>
                    <td className="pr-3">
                      <button onClick={() => setToDelete(s)} aria-label="Eliminar venta" className="grid h-9 w-9 place-items-center rounded-[8px] text-faint hover:bg-alt hover:text-danger">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SaleDialog open={creating} onClose={() => setCreating(false)} />
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Eliminar venta">
        <p className="text-ink-soft">Se borra la venta de <strong className="text-ink">{toDelete?.producto_nombre}</strong>. No se puede deshacer.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setToDelete(null)}>Cancelar</Button>
          <button onClick={remove} className="h-11 rounded-[10px] bg-danger px-6 text-[15px] font-medium text-white">Eliminar</button>
        </div>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-[24px] font-medium tracking-tight">{value}</p>
    </div>
  );
}

function SaleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: products } = useProducts();
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [client, setClient] = useState("");
  const [method, setMethod] = useState("Efectivo");
  const [saving, setSaving] = useState(false);
  const list = (products ?? []).filter((p) => !SYSTEM_NAMES.includes(p.nombre) && p.categoria !== "Sistema");
  const product = list.find((p) => String(p.id) === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return toast.error("Elegí un producto.");
    setSaving(true);
    const { error } = await supabaseBrowser().from("sales").insert([{
      producto_id: product.id,
      producto_nombre: product.nombre,
      cantidad: Number(qty) || 1,
      precio_final: Number(price) || 0,
      precio_costo: product.precio_costo || 0,
      cliente: client.trim() || null,
      metodo_pago: method,
      fecha: new Date().toISOString(),
    }]);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Venta registrada");
    void mutate("admin/sales");
    setProductId("");
    setQty("1");
    setPrice("");
    setClient("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="Registrar venta">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Producto">
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              const p = list.find((x) => String(x.id) === e.target.value);
              if (p?.precio_venta) setPrice(String(p.precio_venta));
            }}
            className="input"
            required
          >
            <option value="">Elegí un producto</option>
            {list.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}{p.almacenamiento && p.almacenamiento !== "-" ? ` ${p.almacenamiento}` : ""}{p.color ? ` · ${p.color}` : ""} ({p.stock ?? 0} en stock)
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cantidad">
            <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))} className="input" />
          </Field>
          <Field label="Precio por unidad (US$)">
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} className="input" required />
          </Field>
        </div>
        <Field label="Cliente (opcional)">
          <input value={client} onChange={(e) => setClient(e.target.value)} className="input" />
        </Field>
        <Field label="Forma de pago">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="input">
            {METHODS.slice(0, 3).map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        {product && (Number(price) || 0) > 0 && product.precio_costo ? (
          <p className="text-[15px] text-ink-soft">Ganancia: {formatUsd(((Number(price) || 0) - product.precio_costo) * (Number(qty) || 1))}</p>
        ) : null}
        <p className="text-[13px] text-muted">El stock no se descuenta solo: quitá la unidad vendida desde el producto.</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Registrar"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
