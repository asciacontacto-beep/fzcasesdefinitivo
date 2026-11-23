"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Box, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import type { ProductDetail } from "@/lib/types";
import { buttonClass } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { QtyStepper } from "@/components/cart/cart-drawer";
import { WhatsAppIcon } from "@/components/layout/whatsapp-fab";
import { useShop } from "@/components/layout/shop-context";
import { ProductGallery } from "./product-gallery";
import { parseNotes } from "@/lib/product-notes";
import { cn, formatArs, formatUsd, waLink } from "@/lib/format";
import { logEvent } from "@/lib/analytics";
import { transferPrice } from "@/lib/shop-defaults";

interface Option {
  key: string;
  color: string;
  storage: string;
  battery: string;
  notes: string;
  image: string | null;
}

function buildOptions(p: ProductDetail): Option[] {
  const base: Option = { key: "base", color: p.color, storage: p.storage, battery: p.battery, notes: p.notes, image: p.image };
  const seen = new Set<string>();
  return [base, ...p.variants.map((v, i) => ({ key: `v${i}`, ...v }))].filter((o) => {
    const id = [o.color, o.storage, o.battery, o.notes].join("|").toLowerCase();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function ProductView({ product, url }: { product: ProductDetail; url: string }) {
  const { whatsapp, usdRate, transferEnabled, transferDiscountPct } = useShop();
  const options = useMemo(() => buildOptions(product), [product]);
  const [selected, setSelected] = useState(options[0]);
  const [activeImage, setActiveImage] = useState<string | null>(product.images[0] ?? null);
  const [qty, setQty] = useState(1);

  const notes = parseNotes(selected.notes);
  const soldOut = product.stock <= 0;
  const isUsed = product.condition === "Usado";
  const images = [...new Set([...product.images, ...options.map((o) => o.image).filter((x): x is string => !!x)])];

  const stateLabel = isUsed ? "Usado" : product.category === "Accesorios" ? "Nuevo" : "Sellado";
  const specs = [
    { label: "Estado", value: stateLabel },
    selected.storage && { label: "Capacidad", value: selected.storage },
    selected.color && { label: "Color", value: selected.color },
    isUsed && selected.battery && { label: "Condición de batería", value: `${selected.battery}%` },
    ...notes.specs,
    product.location && { label: "Disponible en", value: capitalize(product.location) },
    {
      label: "Stock",
      value: soldOut ? "Sin stock" : product.stock === 1 ? "Último disponible" : `${product.stock} unidades`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const optionText = [selected.storage, selected.color, isUsed && selected.battery ? `batería ${selected.battery}%` : ""]
    .filter(Boolean)
    .join(", ");
  const waText = `Hola FZCASES, me interesa ${product.name}${optionText ? ` (${optionText})` : ""}. ¿Sigue disponible?\n${url}`;

  const choose = (o: Option) => {
    setSelected(o);
    if (o.image) setActiveImage(o.image);
  };

  const onWhatsApp = () => logEvent("whatsapp", { producto_id: product.id, nombre: product.name, opcion: optionText });

  const cta = product.sellOnline && !soldOut ? (
    <div className="flex gap-3">
      <QtyStepper qty={qty} max={product.stock} onChange={(q) => setQty(Math.max(1, q))} />
      <AddToCartButton product={{ ...product, color: selected.color || product.color }} qty={qty} className="flex-1" />
    </div>
  ) : (
    <a
      href={waLink(whatsapp, waText)}
      target="_blank"
      rel="noopener"
      onClick={onWhatsApp}
      className={buttonClass("primary", "lg", "w-full")}
    >
      <WhatsAppIcon size={18} /> {soldOut ? "Avisame cuando entre" : "Consultar por WhatsApp"}
    </a>
  );

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-[96px]">
            <ProductGallery images={images} name={product.name} activeImage={activeImage} onSelect={setActiveImage} />
          </div>
        </div>

        <div className="lg:col-span-5">
          <p className="text-[13px] font-medium text-muted">
            {product.category} · {stateLabel}
          </p>
          <h1 className="text-display mt-2 text-[34px] md:text-[48px]">{product.name}</h1>

          <div className="mt-5">
            {product.priceUsd > 0 ? (
              <>
                <p className="text-[28px] font-medium tracking-tight">{formatUsd(product.priceUsd)}</p>
                {product.sellOnline && (
                  <>
                    <p className="text-[15px] text-muted">{formatArs(product.priceUsd * usdRate)} al cambio de hoy</p>
                    {transferEnabled && transferDiscountPct > 0 && (
                      <p className="mt-2 text-[15px] font-medium">
                        {formatArs(transferPrice(product.priceUsd * usdRate, transferDiscountPct))} por transferencia
                        <span className="ml-2 rounded-full bg-alt px-2 py-0.5 text-[13px] text-ink-soft">{transferDiscountPct}% off</span>
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="text-lg text-ink-soft">Te pasamos el precio por WhatsApp.</p>
            )}
          </div>

          {options.length > 1 && (
            <fieldset className="mt-8">
              <legend className="mb-3 text-[15px] font-medium">Elegí tu equipo</legend>
              <div className="grid gap-2">
                {options.map((o) => {
                  const active = o.key === selected.key;
                  const extra = parseNotes(o.notes);
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => choose(o)}
                      aria-pressed={active}
                      className={cn(
                        "flex min-h-14 items-center justify-between gap-4 rounded-[12px] border bg-card px-4 py-3 text-left transition",
                        active ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40",
                      )}
                    >
                      <span>
                        <span className="block text-[15px] font-medium">{[o.storage, o.color].filter(Boolean).join(" · ") || product.name}</span>
                        {extra.specs.length > 0 && (
                          <span className="block text-sm text-muted">{extra.specs.map((s) => s.value).join(" · ")}</span>
                        )}
                      </span>
                      {isUsed && o.battery && <span className="shrink-0 text-sm text-ink-soft">Batería {o.battery}%</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-8 hidden md:block">{cta}</div>
          {product.sellOnline && !soldOut && (
            <a href={waLink(whatsapp, waText)} target="_blank" rel="noopener" onClick={onWhatsApp} className="mt-4 hidden text-[15px] font-medium md:inline-block">
              <span className="link-draw">¿Dudas? Consultanos por WhatsApp</span>
            </a>
          )}

          <dl className="mt-10 divide-y divide-line border-y border-line">
            {specs.map((s) => (
              <div key={s.label} className="flex justify-between gap-6 py-3.5 text-[15px]">
                <dt className="text-muted">{s.label}</dt>
                <dd className="text-right font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>

          {(notes.text || product.description) && (
            <div className="mt-8 space-y-3 text-ink-soft">
              {product.description && <p className="whitespace-pre-line">{product.description}</p>}
              {notes.text && <p>{notes.text}</p>}
            </div>
          )}

          <ul className="mt-10 space-y-5">
            <Perk icon={MapPin} title="Retiro en Tandil o Necochea">
              Coordinamos día y horario cuando confirmás.{product.sellOnline && " También lo enviamos a domicilio."}
            </Perk>
            <Perk
              icon={ShieldCheck}
              title={isUsed || product.category === "Accesorios" ? "Lo probás antes de llevarlo" : "Garantía oficial Apple, 12 meses"}
            >
              Revisás y probás tu compra antes de retirarte.{" "}
              <Link href="/garantia" className="link-draw text-ink">Ver garantía</Link>
            </Perk>
            {product.category !== "Accesorios" && (
              <Perk icon={Box} title="En caja y con cable original">Entregamos cada equipo con su caja y el cable de Apple.</Perk>
            )}
            {/* Los equipos tienen condiciones de pago propias en su descripción: acá no se afirma ninguna. */}
            <Perk icon={CreditCard} title="Pago">
              {product.sellOnline
                ? `Mercado Pago, transferencia${transferEnabled && transferDiscountPct > 0 ? ` con ${transferDiscountPct}% off` : ""} o efectivo al retirar.`
                : "Lo coordinamos por WhatsApp. También podés entregar tu iPhone usado como parte de pago."}
            </Perk>
          </ul>

          {product.category === "iPhone" && (
            <Link href="/canje" className="mt-10 flex items-center justify-between gap-4 rounded-[20px] bg-alt p-6 transition hover:-translate-y-0.5">
              <span>
                <span className="block text-[17px] font-medium">¿Tenés un iPhone para entregar?</span>
                <span className="block text-[15px] text-ink-soft">Cotizalo y usalo como parte de pago.</span>
              </span>
              <span className={buttonClass("secondary", "md", "shrink-0")}>Cotizar</span>
            </Link>
          )}
        </div>
      </div>

      {/* Barra fija en el celular con el precio y la acción principal */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="flex items-center gap-3">
          {product.priceUsd > 0 && <p className="shrink-0 text-lg font-medium">{formatUsd(product.priceUsd)}</p>}
          <div className="flex-1">{product.sellOnline && !soldOut ? (
            <AddToCartButton product={{ ...product, color: selected.color || product.color }} qty={qty} />
          ) : cta}</div>
        </div>
      </div>
    </>
  );
}

function Perk({ icon: Icon, title, children }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 text-ink"><Icon size={20} strokeWidth={1.5} /></span>
      <span>
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="block text-[15px] text-ink-soft">{children}</span>
      </span>
    </li>
  );
}

function capitalize(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
