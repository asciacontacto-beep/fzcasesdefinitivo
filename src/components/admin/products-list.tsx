"use client";
/* eslint-disable @next/next/no-img-element -- miniaturas base64/Storage del panel */
import Link from "next/link";
import { useMemo, useState } from "react";
import { mutate } from "swr";
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { SYSTEM_NAMES, useProducts, type ProductRow } from "@/lib/admin/data";
import { revalidateStore } from "@/lib/admin/revalidate";
import { formatUsd } from "@/lib/format";
import { normalizePath } from "@/lib/images";
import { LinkButton } from "@/components/ui/button";
import { Card, Empty, PageTitle, Pill, Segmented } from "./ui";

type Visibility = "todos" | "activos" | "ocultos" | "sin-stock";

export function ProductsList() {
  const { data, isLoading, error } = useProducts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [vis, setVis] = useState<Visibility>("todos");

  const all = useMemo(() => (data ?? []).filter((p) => !SYSTEM_NAMES.includes(p.nombre) && p.categoria !== "Sistema"), [data]);
  const categories = useMemo(() => [...new Set(all.map((p) => p.categoria))], [all]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((p) => {
      if (cat && p.categoria !== cat) return false;
      if (vis === "activos" && p.activo === false) return false;
      if (vis === "ocultos" && p.activo !== false) return false;
      if (vis === "sin-stock" && (p.stock ?? 0) > 0) return false;
      if (term && !`${p.nombre} ${p.color} ${p.almacenamiento} ${p.categoria}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [all, q, cat, vis]);

  // Solo se puede reordenar mirando la lista completa (si no, el orden quedaría raro)
  const canReorder = !q && !cat && vis === "todos";
  const units = all.reduce((n, p) => n + (p.stock ?? 0), 0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !data) return;
    const from = all.findIndex((p) => p.id === active.id);
    const to = all.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(all, from, to).map((p, i) => ({ ...p, orden: (i + 1) * 10 }));
    const changed = reordered.filter((p) => all.find((o) => o.id === p.id)?.orden !== p.orden);
    const system = data.filter((p) => SYSTEM_NAMES.includes(p.nombre) || p.categoria === "Sistema");
    await mutate("admin/products", [...reordered, ...system], { revalidate: false });
    const sb = supabaseBrowser();
    const results = await Promise.all(changed.map((p) => sb.from("products").update({ orden: p.orden }).eq("id", p.id)));
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error(`No se pudo guardar el orden: ${failed.error.message}`);
      void mutate("admin/products");
      return;
    }
    toast.success("Orden guardado");
    void revalidateStore(["catalog"]);
  };

  const toggleActive = async (p: ProductRow) => {
    const next = p.activo === false;
    await mutate("admin/products", data?.map((x) => (x.id === p.id ? { ...x, activo: next } : x)), { revalidate: false });
    const { error } = await supabaseBrowser().from("products").update({ activo: next }).eq("id", p.id);
    if (error) {
      toast.error(error.message);
      void mutate("admin/products");
      return;
    }
    void revalidateStore(["catalog"], [p.id]);
  };

  return (
    <>
      <PageTitle
        title="Productos"
        subtitle={data ? `${all.length} productos · ${units} unidades en stock` : undefined}
        actions={<LinkButton href="/admin/productos/nuevo"><Plus size={16} /> Nuevo producto</LinkButton>}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por modelo, color, capacidad" aria-label="Buscar productos" className="input pl-10" />
        </label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría" className="input lg:w-52">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Segmented
          value={vis}
          onChange={setVis}
          options={[
            { value: "todos", label: "Todos" },
            { value: "activos", label: "Visibles" },
            { value: "ocultos", label: "Ocultos" },
            { value: "sin-stock", label: "Sin stock" },
          ]}
        />
      </div>

      <Card>
        {error ? (
          <Empty title="No se pudieron cargar los productos" text={String(error.message ?? error)} />
        ) : isLoading ? (
          <div className="space-y-px p-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-[10px]" />)}</div>
        ) : filtered.length === 0 ? (
          <Empty title="No hay productos con esos filtros" />
        ) : (
          <>
            <div className="hidden grid-cols-[28px_56px_1fr_110px_100px_100px_80px_90px] items-center gap-4 border-b border-line px-5 py-3 text-[13px] font-medium text-muted md:grid">
              <span /> <span /> <span>Producto</span> <span>Categoría</span> <span className="text-right">Precio</span> <span className="text-right">Costo</span> <span className="text-right">Stock</span> <span className="text-right">Visible</span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={filtered.map((p) => p.id)} strategy={verticalListSortingStrategy} disabled={!canReorder}>
                <ul className="divide-y divide-line">
                  {filtered.map((p) => <ProductItem key={p.id} p={p} canReorder={canReorder} onToggle={() => toggleActive(p)} />)}
                </ul>
              </SortableContext>
            </DndContext>
            {!canReorder && <p className="border-t border-line px-5 py-3 text-[13px] text-muted">Para cambiar el orden arrastrando, sacá los filtros.</p>}
          </>
        )}
      </Card>
    </>
  );
}

function ProductItem({ p, canReorder, onToggle }: { p: ProductRow; canReorder: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const thumb = p.imagen ? (p.imagen.startsWith("data:") ? p.imagen : normalizePath(p.imagen)) : null;
  const stock = p.stock ?? 0;
  const specs = [p.almacenamiento !== "-" && p.almacenamiento, p.color].filter(Boolean).join(" · ");

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative grid grid-cols-[28px_56px_1fr_auto] items-center gap-4 bg-card px-5 py-3 md:grid-cols-[28px_56px_1fr_110px_100px_100px_80px_90px] ${isDragging ? "z-10 shadow-lg" : ""} ${p.activo === false ? "opacity-60" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        disabled={!canReorder}
        aria-label={`Mover ${p.nombre}`}
        className="grid h-9 w-7 cursor-grab place-items-center rounded text-faint hover:text-ink disabled:cursor-default disabled:opacity-30 active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      <span className="h-12 w-12 overflow-hidden rounded-[10px] bg-alt">{thumb && <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />}</span>
      <Link href={`/admin/productos/${p.id}`} className="min-w-0">
        <span className="block truncate text-[15px] font-medium hover:underline">{p.nombre}</span>
        <span className="block truncate text-[13px] text-muted">
          {specs || "—"}
          {p.subcategoria === "Usado" && " · Usado"}
        </span>
      </Link>
      <span className="hidden text-sm text-ink-soft md:block">{p.categoria}</span>
      <span className="hidden text-right text-sm md:block">{p.precio_venta ? formatUsd(p.precio_venta) : <span className="text-muted">WhatsApp</span>}</span>
      <span className="hidden text-right text-sm text-muted md:block">{p.precio_costo ? formatUsd(p.precio_costo) : "—"}</span>
      <span className="text-right">{stock > 0 ? <span className="text-sm">{stock}</span> : <Pill tone="danger">0</Pill>}</span>
      <span className="hidden justify-end md:flex">
        <button
          role="switch"
          aria-checked={p.activo !== false}
          aria-label={`Visible: ${p.nombre}`}
          onClick={onToggle}
          className={`relative h-6 w-11 rounded-full transition ${p.activo !== false ? "bg-ink" : "bg-line"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${p.activo !== false ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </span>
    </li>
  );
}
