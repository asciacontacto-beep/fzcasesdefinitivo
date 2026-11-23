"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { mutate } from "swr";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { saveShopSettings, saveSiteSettings, useSettings, type SiteSettingsRaw } from "@/lib/admin/data";
import { revalidateStore } from "@/lib/admin/revalidate";
import useSWR from "swr";
import { DEFAULT_SHOP_SETTINGS, DOLAR_CASAS, transferPrice } from "@/lib/shop-defaults";
import type { DeliveryOption, DolarCasa, ShopSettings } from "@/lib/types";
import { normalizePath } from "@/lib/images";
import { formatArs } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, Field, Notice, PageTitle, Segmented, Switch } from "./ui";
import { ImageSlot } from "./image-slot";

type Tab = "portada" | "categorias" | "modelos" | "tienda";

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function SettingsView() {
  const { data, isLoading } = useSettings();
  const [tab, setTab] = useState<Tab>("portada");
  const [site, setSite] = useState<SiteSettingsRaw | null>(null);
  const [shop, setShop] = useState<ShopSettings | null>(null);
  const [saving, setSaving] = useState(false);

  // Copia editable de la config, armada una sola vez cuando llegan los datos.
  if (data && !site) {
    const s = { ...data.site };
    // Portadas del panel viejo (filas __SYSTEM_HERO__) → lista de URLs
    if (!s.heroSlides?.length) {
      s.heroSlides = data.legacyHero.filter((h) => h.activo !== false && h.imagen).map((h) => (h.imagen!.startsWith("data:") ? `/api/img?id=${h.id}&slot=1` : h.imagen!));
    }
    s.categoryNav ??= { enabled: true, items: [] };
    s.customModels ??= {};
    setSite(s);
    const raw = data.shop ?? {};
    setShop({
      ...DEFAULT_SHOP_SETTINGS,
      ...raw,
      bank: { ...DEFAULT_SHOP_SETTINGS.bank, ...(raw.bank ?? {}) },
      usdManual: Number(raw.usdManual ?? raw.usdRate) || DEFAULT_SHOP_SETTINGS.usdManual,
    } as ShopSettings);
  }

  if (isLoading || !site || !shop || !data) return <div className="skeleton h-96 rounded-[20px]" />;

  const patch = (p: Partial<SiteSettingsRaw>) => setSite({ ...site, ...p });

  const save = async () => {
    setSaving(true);
    try {
      if (tab === "tienda") {
        if (!data.hasTable) throw new Error("Falta correr la migración para guardar la configuración de la tienda.");
        // usdRate guarda la manual (compatibilidad); la automática se calcula en cada carga.
        const { usdInfo: _info, ...toSave } = shop;
        void _info;
        await saveShopSettings({ ...toSave, usdRate: shop.usdManual });
      } else {
        await saveSiteSettings(site, data.hasTable);
      }
      await Promise.all([mutate("admin/settings"), revalidateStore(["settings"])]);
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      <PageTitle
        title="Configuración"
        actions={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "portada", label: "Portada" },
              { value: "categorias", label: "Categorías" },
              { value: "modelos", label: "Modelos" },
              { value: "tienda", label: "Tienda online" },
            ]}
          />
        }
      />

      {!data.hasTable && (
        <div className="mb-6">
          <Notice>La migración 001 todavía no corrió: los cambios de Portada, Categorías y Modelos se guardan en la configuración vieja (funciona igual), y la pestaña Tienda online queda bloqueada.</Notice>
        </div>
      )}

      {tab === "portada" && <HeroSettings site={site} patch={patch} />}
      {tab === "categorias" && <CategorySettings site={site} patch={patch} />}
      {tab === "modelos" && <ModelSettings site={site} patch={patch} />}
      {tab === "tienda" && <ShopSettingsForm shop={shop} setShop={setShop} disabled={!data.hasTable} />}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper lg:left-[248px]">
        <div className="flex justify-end px-4 py-3 sm:px-8 lg:px-10">
          <Button onClick={save} disabled={saving || (tab === "tienda" && !data.hasTable)}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
        </div>
      </div>
    </div>
  );
}

function HeroSettings({ site, patch }: { site: SiteSettingsRaw; patch: (p: Partial<SiteSettingsRaw>) => void }) {
  const slides = site.heroSlides ?? [];
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Textos de la portada">
        <div className="space-y-5 p-6">
          <Field label="Título" hint="Vacío usa: “iPhone y equipos Apple en Tandil y Necochea”.">
            <input value={site.heroTitle ?? ""} onChange={(e) => patch({ heroTitle: e.target.value })} className="input" />
          </Field>
          <Field label="Bajada">
            <textarea rows={3} value={site.heroSubtitle ?? ""} onChange={(e) => patch({ heroSubtitle: e.target.value })} className="input" />
          </Field>
          <Field label="Título del plan canje">
            <input value={site.canjeTitle ?? ""} onChange={(e) => patch({ canjeTitle: e.target.value })} className="input" placeholder="¿Querés cambiar tu iPhone?" />
          </Field>
          <Field label="Bajada del plan canje">
            <textarea rows={2} value={site.canjeSubtitle ?? ""} onChange={(e) => patch({ canjeSubtitle: e.target.value })} className="input" />
          </Field>
        </div>
      </Card>

      <Card title="Foto de portada">
        <div className="p-6">
          <p className="mb-4 text-[15px] text-ink-soft">Se muestra la primera foto de la lista. Las demás quedan guardadas para cambiarla cuando quieras.</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slides.length === 0 && (
              <li>
                <div className="aspect-[4/3] overflow-hidden rounded-[12px] border border-ink ring-1 ring-ink">
                  <img src="/assets/hero-fz.jpg" alt="" className="h-full w-full object-cover" />
                </div>
                <span className="mt-1.5 block text-[13px] text-muted">En portada (foto por defecto)</span>
              </li>
            )}
            {slides.map((src, i) => (
              <li key={src + i} className="group relative">
                <div className={`aspect-[4/3] overflow-hidden rounded-[12px] border ${i === 0 ? "border-ink ring-1 ring-ink" : "border-line"}`}>
                  <img src={normalizePath(src)} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[13px] text-muted">{i === 0 ? "En portada" : `Foto ${i + 1}`}</span>
                  <span className="flex">
                    {i > 0 && (
                      <button onClick={() => patch({ heroSlides: [src, ...slides.filter((_, j) => j !== i)] })} className="h-8 rounded-[8px] px-2 text-[13px] font-medium hover:bg-alt">Usar</button>
                    )}
                    <button onClick={() => patch({ heroSlides: slides.filter((_, j) => j !== i) })} aria-label="Quitar foto" className="grid h-8 w-8 place-items-center rounded-[8px] text-ink-soft hover:bg-alt hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              </li>
            ))}
            <li>
              <ImageSlot value={null} folder="hero" label="Agregar foto" onChange={(url) => url && patch({ heroSlides: [...slides, url] })} />
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

function CategorySettings({ site, patch }: { site: SiteSettingsRaw; patch: (p: Partial<SiteSettingsRaw>) => void }) {
  const nav = site.categoryNav ?? { enabled: true, items: [] };
  const items = nav.items;
  const setItems = (next: typeof items) => patch({ categoryNav: { ...nav, items: next } });
  const update = (i: number, p: Partial<(typeof items)[number]>) => setItems(items.map((it, j) => (j === i ? { ...it, ...p } : it)));

  return (
    <Card title="Tira de categorías de la portada" action={<Switch checked={nav.enabled} onChange={(v) => patch({ categoryNav: { ...nav, enabled: v } })} label="Mostrar" />}>
      <ul className="divide-y divide-line">
        {items.map((it, i) => {
          const preview = it.imgUrl ? (it.imgUrl.startsWith("data:") || it.imgUrl.startsWith("http") ? it.imgUrl : normalizePath(it.imgUrl)) : null;
          return (
            <li key={i} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-6 py-4">
              <ImageSlot value={preview} folder="categorias" label={`imagen de ${it.name}`} onChange={(url) => update(i, { imgUrl: url ?? "" })} className="w-16" />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <input value={it.name} onChange={(e) => update(i, { name: e.target.value })} aria-label="Nombre de la categoría" className="input" />
                <Switch checked={it.active} onChange={(v) => update(i, { active: v })} label="Visible" />
              </div>
              <div className="flex">
                <IconBtn label="Subir" onClick={() => setItems(move(items, i, -1))} disabled={i === 0}><ArrowUp size={15} /></IconBtn>
                <IconBtn label="Bajar" onClick={() => setItems(move(items, i, 1))} disabled={i === items.length - 1}><ArrowDown size={15} /></IconBtn>
                <IconBtn label="Quitar" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 size={15} /></IconBtn>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line p-4">
        <Button variant="secondary" onClick={() => setItems([...items, { name: "Nueva categoría", url: "", imgUrl: "", active: true }])}>
          <Plus size={16} /> Agregar categoría
        </Button>
        <p className="mt-3 text-[13px] text-muted">El nombre tiene que coincidir con la categoría de los productos para que el link filtre bien. Usá imágenes PNG sin fondo.</p>
      </div>
    </Card>
  );
}

function ModelSettings({ site, patch }: { site: SiteSettingsRaw; patch: (p: Partial<SiteSettingsRaw>) => void }) {
  const models = site.customModels ?? {};
  const [draft, setDraft] = useState<Record<string, string>>({});
  const cats = Object.keys(models).length ? Object.keys(models) : ["iPhone", "iPad", "MacBook", "Apple Watch", "AirPods", "Accesorios"];
  const setList = (cat: string, list: string[]) => patch({ customModels: { ...models, [cat]: list } });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {cats.map((cat) => {
        const list = models[cat] ?? [];
        const add = () => {
          const v = (draft[cat] ?? "").trim();
          if (!v || list.includes(v)) return;
          setList(cat, [...list, v].sort((a, b) => a.localeCompare(b, "es", { numeric: true })));
          setDraft({ ...draft, [cat]: "" });
        };
        return (
          <Card key={cat} title={`${cat} (${list.length})`}>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {list.map((m) => (
                  <span key={m} className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-line pl-3 pr-1 text-sm">
                    {m}
                    <button onClick={() => setList(cat, list.filter((x) => x !== m))} aria-label={`Quitar ${m}`} className="grid h-6 w-6 place-items-center rounded text-faint hover:text-danger">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  add();
                }}
                className="mt-4 flex gap-2"
              >
                <input value={draft[cat] ?? ""} onChange={(e) => setDraft({ ...draft, [cat]: e.target.value })} placeholder="Agregar modelo" aria-label={`Agregar modelo a ${cat}`} className="input" />
                <Button type="submit" variant="secondary">Agregar</Button>
              </form>
            </div>
          </Card>
        );
      })}
      <p className="text-[13px] text-muted lg:col-span-2">Estos modelos aparecen como sugerencias al cargar un producto.</p>
    </div>
  );
}

function ShopSettingsForm({ shop, setShop, disabled }: { shop: ShopSettings; setShop: (s: ShopSettings) => void; disabled: boolean }) {
  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => setShop({ ...shop, [k]: v });
  const opts = shop.deliveryOptions;
  const updateOpt = (i: number, p: Partial<DeliveryOption>) => set("deliveryOptions", opts.map((o, j) => (j === i ? { ...o, ...p } : o)));

  return (
    <fieldset disabled={disabled} className="grid gap-6 disabled:opacity-50 xl:grid-cols-2">
      <DollarCard shop={shop} set={set} />

      <Card title="Formas de pago en el checkout">
        <div className="space-y-5 p-6">
          <Switch checked={shop.mercadoPagoEnabled} onChange={(v) => set("mercadoPagoEnabled", v)} label="Mercado Pago" hint="Necesita MP_ACCESS_TOKEN configurado en Vercel." />
          <Switch checked={shop.transferEnabled} onChange={(v) => set("transferEnabled", v)} label="Transferencia" hint={`Con ${shop.transferDiscountPct || 0}% de descuento. Los datos de la cuenta se muestran al confirmar el pedido.`} />
          <Switch checked={shop.whatsappCheckoutEnabled} onChange={(v) => set("whatsappCheckoutEnabled", v)} label="Efectivo al retirar" hint="El pedido llega y lo coordinan por WhatsApp." />
          <Field label="WhatsApp de la tienda" hint="Con código de país y sin símbolos: 5492494521518">
            <input inputMode="numeric" value={shop.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/[^\d]/g, ""))} className="input" />
          </Field>
        </div>
      </Card>

      <Card title="Transferencia" className="xl:col-span-2">
        <div className="grid gap-5 p-6 md:grid-cols-3">
          <Field label="Descuento por transferencia (%)" hint={`Ej.: ${formatArs(100000)} → ${formatArs(transferPrice(100000, shop.transferDiscountPct))} pagando por transferencia.`}>
            <input inputMode="numeric" value={shop.transferDiscountPct || ""} onChange={(e) => set("transferDiscountPct", Math.min(Number(e.target.value.replace(/[^\d]/g, "")) || 0, 90))} className="input" placeholder="10" />
          </Field>
          <Field label="Titular">
            <input value={shop.bank.titular} onChange={(e) => set("bank", { ...shop.bank, titular: e.target.value })} className="input" />
          </Field>
          <Field label="Banco / billetera">
            <input value={shop.bank.banco} onChange={(e) => set("bank", { ...shop.bank, banco: e.target.value })} className="input" placeholder="Naranja X" />
          </Field>
          <Field label="CBU / CVU">
            <input inputMode="numeric" value={shop.bank.cbu} onChange={(e) => set("bank", { ...shop.bank, cbu: e.target.value.replace(/[^\d]/g, "").slice(0, 22) })} className="input" />
          </Field>
          <Field label="Alias">
            <input value={shop.bank.alias} onChange={(e) => set("bank", { ...shop.bank, alias: e.target.value.trim() })} className="input" />
          </Field>
          <Field label="CUIL / CUIT">
            <input inputMode="numeric" value={shop.bank.cuil} onChange={(e) => set("bank", { ...shop.bank, cuil: e.target.value.replace(/[^\d-]/g, "") })} className="input" />
          </Field>
          <Field label="Tipo y número de cuenta" className="md:col-span-3" hint="Opcional. Ej: Caja de ahorro en pesos 1234567890">
            <input value={shop.bank.cuenta} onChange={(e) => set("bank", { ...shop.bank, cuenta: e.target.value })} className="input" />
          </Field>
          {shop.bank.cbu && shop.bank.cbu.length !== 22 && <p className="text-[13px] text-danger md:col-span-3">El CBU/CVU tiene que tener 22 números (tiene {shop.bank.cbu.length}).</p>}
        </div>
      </Card>

      <Card title="Opciones de entrega" className="xl:col-span-2">
        <ul className="divide-y divide-line">
          {opts.map((o, i) => (
            <li key={o.id} className="grid gap-3 px-6 py-4 md:grid-cols-[1fr_160px_1fr_auto_auto] md:items-center">
              <input value={o.label} onChange={(e) => updateOpt(i, { label: e.target.value })} aria-label="Nombre" className="input" />
              <input inputMode="numeric" value={o.priceArs || ""} placeholder="Costo $ (0 = gratis)" onChange={(e) => updateOpt(i, { priceArs: Number(e.target.value.replace(/[^\d]/g, "")) || 0 })} aria-label="Costo en pesos" className="input" />
              <input value={o.note ?? ""} onChange={(e) => updateOpt(i, { note: e.target.value })} placeholder="Aclaración (opcional)" aria-label="Aclaración" className="input" />
              <Switch checked={o.needsAddress} onChange={(v) => updateOpt(i, { needsAddress: v })} label="Pide dirección" />
              <IconBtn label="Quitar" onClick={() => set("deliveryOptions", opts.filter((_, j) => j !== i))} disabled={opts.length === 1}><Trash2 size={15} /></IconBtn>
            </li>
          ))}
        </ul>
        <div className="border-t border-line p-4">
          <Button variant="secondary" type="button" onClick={() => set("deliveryOptions", [...opts, { id: `entrega_${Date.now().toString(36)}`, label: "Nueva opción", priceArs: 0, needsAddress: false }])}>
            <Plus size={16} /> Agregar opción
          </Button>
        </div>
      </Card>
    </fieldset>
  );
}

interface Quote {
  casa: DolarCasa;
  venta: number;
  fechaActualizacion: string;
}

function DollarCard({ shop, set }: { shop: ShopSettings; set: <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => void }) {
  const { data: quotes, error } = useSWR<Quote[]>("/api/dolar", (u: string) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error("sin respuesta")))), { refreshInterval: 300_000 });
  const quote = quotes?.find((q) => q.casa === shop.usdCasa);
  const auto = shop.usdSource === "dolarapi";
  const effective = auto && quote ? Math.round(quote.venta + (shop.usdAdjust || 0)) : shop.usdManual;

  return (
    <Card title="Cotización del dólar">
      <div className="space-y-5 p-6">
        <Segmented
          value={shop.usdSource}
          onChange={(v) => set("usdSource", v)}
          options={[
            { value: "dolarapi", label: "Automática" },
            { value: "manual", label: "Manual" },
          ]}
        />
        {auto ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tipo de dólar" hint="Se toma el valor de venta de dolarapi.com.">
                <select value={shop.usdCasa} onChange={(e) => set("usdCasa", e.target.value as DolarCasa)} className="input">
                  {DOLAR_CASAS.map((c) => {
                    const q = quotes?.find((x) => x.casa === c.value);
                    return <option key={c.value} value={c.value}>{c.label}{q ? ` · ${formatArs(q.venta)}` : ""}</option>;
                  })}
                </select>
              </Field>
              <Field label="Ajuste en pesos (opcional)" hint="Se suma a la cotización. Puede ser negativo.">
                <input inputMode="numeric" value={shop.usdAdjust || ""} onChange={(e) => set("usdAdjust", Number(e.target.value.replace(/[^\d-]/g, "")) || 0)} className="input" placeholder="0" />
              </Field>
            </div>
            {error && <Notice>dolarapi no responde ahora. Mientras tanto la tienda usa la cotización manual ({formatArs(shop.usdManual)}).</Notice>}
          </>
        ) : null}
        <Field label={auto ? "Cotización de respaldo" : "Cotización (ARS por US$ 1)"} hint={auto ? "Se usa solo si dolarapi no responde." : undefined}>
          <input inputMode="decimal" value={shop.usdManual || ""} onChange={(e) => set("usdManual", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} className="input" />
        </Field>
        <div className="rounded-[12px] bg-alt px-4 py-3 text-[15px]">
          <p>
            Hoy se cobra <strong>{formatArs(effective)}</strong> por dólar
            {auto && quote && <span className="text-ink-soft"> (actualizado {new Date(quote.fechaActualizacion).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })})</span>}.
          </p>
          <p className="text-ink-soft">Un accesorio de US$ 70 sale {formatArs(70 * effective)}.</p>
        </div>
      </div>
    </Card>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="grid h-9 w-9 place-items-center rounded-[8px] text-ink-soft hover:bg-alt hover:text-ink disabled:opacity-30">
      {children}
    </button>
  );
}
