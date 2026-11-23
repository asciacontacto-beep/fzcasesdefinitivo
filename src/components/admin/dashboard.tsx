"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SYSTEM_NAMES, useEvents, useOrders, useProducts, useSales, useSchemaStatus, type EventRow } from "@/lib/admin/data";
import { formatUsd } from "@/lib/format";
import { Card, Empty, Notice, PageTitle, Segmented } from "./ui";

const INK = "#1a1917";
const MUTED = "#6b6862";
const LINE = "#e4e1db";

type Range = "7" | "30" | "90";

const PAGE_NAMES: Record<string, string> = {
  "/": "Inicio",
  "index.html": "Inicio",
  "/catalogo": "Catálogo",
  "catalogo.html": "Catálogo",
  "/tienda": "Accesorios",
  "/canje": "Plan canje",
  "/nosotros": "Nosotros",
  "nosotros.html": "Nosotros",
  "/garantia": "Garantía",
  "garantia.html": "Garantía",
  "/info-importante": "Info importante",
  "info-importante.html": "Info importante",
  "/checkout": "Checkout",
};

function pageName(p: string | null) {
  if (!p) return "Otra";
  if (p.startsWith("/producto/")) return "Fichas de producto";
  // El sitio viejo guardaba "catalogo", "catalogo.html", "index.html"; el nuevo, "/catalogo"
  const key = "/" + p.replace(/^\/+/, "").replace(/\.html$/, "").replace(/^index$/, "");
  return PAGE_NAMES[key] ?? PAGE_NAMES[p] ?? p;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function Dashboard() {
  const [range, setRange] = useState<Range>("30");
  const days = Number(range);
  // "Ahora" fijo durante la vida de la pantalla (los cálculos de abajo quedan puros)
  const [now] = useState(() => Date.now());
  const { data: events, isLoading: loadingEvents } = useEvents(days);
  const { data: sales } = useSales();
  const { data: products } = useProducts();
  const { data: orders } = useOrders();
  const { data: schema } = useSchemaStatus();

  const stats = useMemo(() => {
    const ev = events ?? [];
    const by = (t: string) => ev.filter((e) => e.tipo === t);
    const visits = by("visita");

    // Visitas por día (todos los días del rango, también los que tienen 0)
    const counts = new Map<string, number>();
    for (const e of visits) counts.set(dayKey(new Date(e.created_at)), (counts.get(dayKey(new Date(e.created_at))) ?? 0) + 1);
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1 - i));
      return { day: dayKey(d), label: d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }), visitas: counts.get(dayKey(d)) ?? 0 };
    });

    const pages = countBy(visits, (e) => pageName(e.pagina)).slice(0, 6);
    const waProducts = countBy(by("whatsapp"), (e) => String(e.datos?.nombre ?? "Consulta general")).slice(0, 5);

    const since = now - days * 86_400_000;
    const rangeSales = (sales ?? []).filter((s) => new Date(s.fecha).getTime() >= since);
    const revenue = rangeSales.reduce((n, s) => n + s.precio_final * s.cantidad, 0);
    const cost = rangeSales.reduce((n, s) => n + (s.precio_costo || 0) * s.cantidad, 0);

    return {
      visits: visits.length,
      whatsapp: by("whatsapp").length,
      canjes: by("canje").length,
      series,
      pages,
      waProducts,
      salesCount: rangeSales.length,
      revenue,
      profit: revenue - cost,
    };
  }, [events, sales, days, now]);

  const catalog = (products ?? []).filter((p) => !SYSTEM_NAMES.includes(p.nombre) && p.categoria !== "Sistema");
  const lowStock = catalog.filter((p) => p.activo !== false && (p.stock ?? 0) <= 0);
  const openOrders = (orders ?? []).filter((o) => ["pendiente", "pagado", "preparando", "listo"].includes(o.estado));

  return (
    <>
      <PageTitle
        title="Resumen"
        actions={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "7 días" },
              { value: "30", label: "30 días" },
              { value: "90", label: "90 días" },
            ]}
          />
        }
      />

      {schema && (!schema.settings || !schema.orders) && (
        <div className="mb-6">
          <Notice>
            Falta correr la migración <code>20261123_001_ecommerce.sql</code> en Supabase. Sin ella no hay pedidos online, cotización ni fotos en Storage.
          </Notice>
        </div>
      )}

      <div className="grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Visitas" value={stats.visits.toLocaleString("es-AR")} loading={loadingEvents} />
        <Kpi label="Consultas por WhatsApp" value={stats.whatsapp.toLocaleString("es-AR")} loading={loadingEvents} />
        <Kpi label={`Ventas (${stats.salesCount})`} value={formatUsd(stats.revenue)} />
        <Kpi label="Ganancia" value={formatUsd(stats.profit)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Visitas por día" className="xl:col-span-2">
          <div className="h-72 px-2 pb-4 pt-6">
            {stats.visits === 0 && !loadingEvents ? (
              <Empty title="Sin visitas registradas en este período" text="Las visitas se registran en la tienda publicada, no en las pruebas locales." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.series} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={LINE} />
                  <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 13 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 13 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    cursor={{ stroke: INK, strokeWidth: 1, strokeDasharray: "3 3" }}
                    contentStyle={{ borderRadius: 12, border: `1px solid ${LINE}`, fontSize: 14 }}
                    labelStyle={{ color: MUTED }}
                    formatter={(v) => [v, "Visitas"]}
                  />
                  <Area type="monotone" dataKey="visitas" stroke={INK} strokeWidth={2} fill={INK} fillOpacity={0.06} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Páginas más vistas">
          <BarList items={stats.pages} empty="Sin datos todavía" />
        </Card>

        <Card title="Pedidos abiertos" action={<Link href="/admin/pedidos" className="text-sm font-medium"><span className="link-draw">Ver todos</span></Link>}>
          {orders === null ? (
            <p className="p-6 text-[15px] text-ink-soft">Disponible después de la migración.</p>
          ) : openOrders.length === 0 ? (
            <p className="p-6 text-[15px] text-ink-soft">No hay pedidos para preparar.</p>
          ) : (
            <ul className="divide-y divide-line">
              {openOrders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex justify-between gap-4 px-6 py-3 text-[15px]">
                  <span>#{o.numero} · {o.cliente_nombre}</span>
                  <span className="text-muted">{o.estado}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Productos más consultados">
          <BarList items={stats.waProducts} empty="Todavía no hay consultas registradas desde las fichas." />
        </Card>

        <Card title="Sin stock y visibles" action={<Link href="/admin/productos" className="text-sm font-medium"><span className="link-draw">Productos</span></Link>}>
          {lowStock.length === 0 ? (
            <p className="p-6 text-[15px] text-ink-soft">Todo lo publicado tiene stock.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/productos/${p.id}`} className="block px-6 py-3 text-[15px] hover:bg-alt">{p.nombre}</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-[13px] text-muted">Cotizaciones de canje enviadas en el período: {stats.canjes}.</p>
    </>
  );
}

function countBy(list: EventRow[], key: (e: EventRow) => string) {
  const m = new Map<string, number>();
  for (const e of list) m.set(key(e), (m.get(key(e)) ?? 0) + 1);
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function Kpi({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="bg-card p-6">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      {loading ? <div className="skeleton mt-2 h-9 w-24 rounded" /> : <p className="mt-1 text-[32px] font-medium tracking-tight">{value}</p>}
    </div>
  );
}

/** Barras horizontales de una sola serie, con el valor escrito al lado. */
function BarList({ items, empty }: { items: { label: string; value: number }[]; empty: string }) {
  if (items.length === 0) return <p className="p-6 text-[15px] text-ink-soft">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ul className="space-y-3 p-6">
      {items.map((i) => (
        <li key={i.label} title={`${i.label}: ${i.value}`}>
          <div className="mb-1 flex justify-between gap-4 text-[15px]">
            <span className="truncate">{i.label}</span>
            <span className="text-ink-soft">{i.value.toLocaleString("es-AR")}</span>
          </div>
          <div className="h-2 rounded-full bg-alt">
            <div className="h-2 rounded-full bg-ink" style={{ width: `${Math.max((i.value / max) * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
