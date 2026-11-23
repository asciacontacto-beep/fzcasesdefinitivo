"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/cart-store";
import { useShop } from "@/components/layout/shop-context";
import { WhatsAppIcon } from "@/components/layout/whatsapp-fab";
import { buttonClass } from "@/components/ui/button";
import { computeTotals, PAYMENT_LABEL, type PaymentMethod } from "@/lib/checkout";
import { cn, formatArs, formatUsd } from "@/lib/format";
import { normalizePath, PLACEHOLDER_IMAGE } from "@/lib/images";
import { useHydrated } from "@/lib/use-hydrated";
import { logEvent } from "@/lib/analytics";

export const ORDER_STORAGE_KEY = "fz-last-order";

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, clear } = useCart();
  const shop = useShop();

  const methods: { id: PaymentMethod; hint: string }[] = [
    shop.transferEnabled && { id: "transferencia" as const, hint: shop.transferDiscountPct > 0 ? `${shop.transferDiscountPct}% de descuento. Te pasamos los datos al confirmar.` : "Te pasamos los datos al confirmar." },
    shop.whatsappCheckoutEnabled && { id: "efectivo" as const, hint: "Pagás cuando lo retirás." },
  ].filter(Boolean) as { id: PaymentMethod; hint: string }[];

  const [method, setMethod] = useState<PaymentMethod>(methods[0]?.id ?? "efectivo");
  const [deliveryId, setDeliveryId] = useState(shop.deliveryOptions[0]?.id ?? "");
  const [customer, setCustomer] = useState({ nombre: "", telefono: "", email: "" });
  const [address, setAddress] = useState({ calle: "", ciudad: "", provincia: "Buenos Aires", cp: "" });
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const delivery = shop.deliveryOptions.find((d) => d.id === deliveryId);
  const totals = computeTotals(items, shop, method, delivery);

  if (!hydrated) return <div className="skeleton h-[480px] rounded-[20px]" />;

  if (items.length === 0) {
    return (
      <div className="rounded-[20px] border border-line bg-card px-6 py-16 text-center">
        <p className="text-[20px] font-medium">Tu carrito está vacío</p>
        <p className="mt-1 text-ink-soft">Sumá accesorios desde la tienda para hacer el pedido.</p>
        <Link href="/tienda" className={buttonClass("primary", "md", "mt-6")}>Ir a la tienda</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((i) => ({ id: i.id, qty: i.qty })),
          method,
          deliveryId,
          customer,
          address: delivery?.needsAddress ? address : null,
          notes,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "No se pudo enviar el pedido.");
      sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(data));
      logEvent("checkout", { metodo: method, total: data.totals?.totalArs, numero: data.numero });
      clear();
      router.push("/checkout/listo");
    } catch (err) {
      toast.error((err as Error).message);
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="space-y-10 lg:col-span-7">
        <Section n={1} title="Tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre y apellido" value={customer.nombre} onChange={(v) => setCustomer({ ...customer, nombre: v })} required autoComplete="name" className="sm:col-span-2" />
            <Input label="WhatsApp" value={customer.telefono} onChange={(v) => setCustomer({ ...customer, telefono: v })} required type="tel" autoComplete="tel" placeholder="2494 123456" />
            <Input label="Email (opcional)" value={customer.email} onChange={(v) => setCustomer({ ...customer, email: v })} type="email" autoComplete="email" />
          </div>
        </Section>

        <Section n={2} title="Entrega">
          <div className="grid gap-3">
            {shop.deliveryOptions.map((d) => (
              <Choice key={d.id} name="entrega" checked={deliveryId === d.id} onChange={() => setDeliveryId(d.id)} title={d.label} hint={d.note} right={d.priceArs > 0 ? formatArs(d.priceArs) : d.needsAddress ? "A coordinar" : "Sin costo"} />
            ))}
          </div>
          {delivery?.needsAddress && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Calle y número" value={address.calle} onChange={(v) => setAddress({ ...address, calle: v })} required autoComplete="street-address" className="sm:col-span-2" />
              <Input label="Ciudad" value={address.ciudad} onChange={(v) => setAddress({ ...address, ciudad: v })} required autoComplete="address-level2" />
              <Input label="Código postal" value={address.cp} onChange={(v) => setAddress({ ...address, cp: v })} autoComplete="postal-code" />
              <Input label="Provincia" value={address.provincia} onChange={(v) => setAddress({ ...address, provincia: v })} autoComplete="address-level1" className="sm:col-span-2" />
            </div>
          )}
        </Section>

        <Section n={3} title="Pago">
          <div className="grid gap-3">
            {methods.map((m) => (
              <Choice
                key={m.id}
                name="pago"
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                title={PAYMENT_LABEL[m.id]}
                hint={m.hint}
                right={m.id === "transferencia" && shop.transferDiscountPct > 0 ? `${shop.transferDiscountPct}% off` : undefined}
              />
            ))}
            {shop.mercadoPagoEnabled && (
              <div className="flex min-h-16 items-center justify-between rounded-[12px] border border-dashed border-line px-4 py-3 text-ink-soft">
                <span>
                  <span className="block text-[15px] font-medium">Mercado Pago</span>
                  <span className="block text-[13px]">Muy pronto: tarjeta de crédito, débito y dinero en cuenta.</span>
                </span>
              </div>
            )}
          </div>
          <label className="mt-6 block">
            <span className="label">Nota para la tienda (opcional)</span>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="input" placeholder="Horario en que podés retirar, para quién es, etc." />
          </label>
        </Section>
      </div>

      <aside className="lg:col-span-5">
        <div className="rounded-[20px] border border-line bg-card lg:sticky lg:top-[96px]">
          <h2 className="border-b border-line px-6 py-4 text-[17px] font-medium">Tu pedido</h2>
          <ul className="divide-y divide-line px-6">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-alt">
                  <img src={i.image ? (i.image.startsWith("data:") ? i.image : normalizePath(i.image)) : PLACEHOLDER_IMAGE} alt="" className="h-full w-full object-cover" />
                  <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] text-paper">{i.qty}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{i.name}</span>
                  {i.color && <span className="block text-[13px] text-muted">{i.color}</span>}
                </span>
                <span className="text-[15px]">{formatUsd(i.priceUsd * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line px-6 py-5 text-[15px]">
            <Row label="Subtotal" value={formatArs(totals.subtotalArs)} />
            {totals.discountArs > 0 && <Row label={`Descuento transferencia (${shop.transferDiscountPct}%)`} value={`− ${formatArs(totals.discountArs)}`} />}
            <Row label="Envío" value={totals.shippingArs > 0 ? formatArs(totals.shippingArs) : delivery?.needsAddress ? "A coordinar" : "Sin costo"} />
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-medium">Total</dt>
              <dd className="text-[24px] font-medium tracking-tight">{formatArs(totals.totalArs)}</dd>
            </div>
            <p className="text-[13px] text-muted">Dólar a {formatArs(totals.rate)} · {formatUsd(totals.subtotalUsd)}</p>
          </dl>
          <div className="px-6 pb-6">
            <button type="submit" disabled={sending || methods.length === 0} className={buttonClass("primary", "lg", "w-full")}>
              <WhatsAppIcon size={18} /> {sending ? "Armando el pedido…" : "Hacer el pedido"}
            </button>
            <p className="mt-3 text-center text-[13px] text-muted">Te llevamos a WhatsApp con el pedido escrito para que nos lo mandes.</p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-3 text-[20px] font-medium">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[13px] text-paper">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  className,
  ...props
}: { label: string; value: string; onChange: (v: string) => void; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input" {...props} />
    </label>
  );
}

function Choice({ name, checked, onChange, title, hint, right }: { name: string; checked: boolean; onChange: () => void; title: string; hint?: string; right?: string }) {
  return (
    <label className={cn("flex min-h-16 cursor-pointer items-center gap-4 rounded-[12px] border bg-card px-4 py-3 transition", checked ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40")}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-[#1a1917]" />
      <span className="flex-1">
        <span className="block text-[15px] font-medium">{title}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      {right && <span className="text-[15px] text-ink-soft">{right}</span>}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-ink-soft">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
