"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/format";

type Sort = "relevancia" | "precio-asc" | "precio-desc" | "nuevos";

const SORTS: { id: Sort; label: string }[] = [
  { id: "relevancia", label: "Relevancia" },
  { id: "nuevos", label: "Más nuevos" },
  { id: "precio-asc", label: "Menor precio" },
  { id: "precio-desc", label: "Mayor precio" },
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CatalogView({
  products,
  categories,
  lockedCategory,
}: {
  products: Product[];
  categories: string[];
  /** En /tienda la categoría queda fija en Accesorios. */
  lockedCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Links viejos del tipo catalogo.html?product_id=123
  useEffect(() => {
    const legacyId = params.get("product_id");
    if (legacyId) router.replace(`/producto/${legacyId}`);
  }, [params, router]);

  const cat = lockedCategory ?? params.get("cat") ?? "";
  const estado = params.get("estado") ?? "";
  const sort = (params.get("orden") as Sort) || "relevancia";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [storage, setStorage] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [onlyStock, setOnlyStock] = useState(true);
  const [onlyOnline, setOnlyOnline] = useState(false);

  // Si la búsqueda cambia desde afuera (buscador del navbar), se refleja en el input.
  const urlQ = params.get("q") ?? "";
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    if (urlQ !== q.trim()) setQ(urlQ);
  }

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Debounce de la búsqueda hacia la URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) setParam("q", q.trim());
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const scoped = useMemo(() => products.filter((p) => !cat || p.category === cat), [products, cat]);
  const facets = useMemo(() => {
    const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
    return {
      storage: uniq(scoped.map((p) => p.storage)),
      colors: uniq(scoped.map((p) => p.color)),
      locations: uniq(scoped.map((p) => p.location)),
    };
  }, [scoped]);

  const results = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const list = scoped.filter((p) => {
      if (estado && p.condition !== estado) return false;
      if (onlyStock && p.stock <= 0) return false;
      if (onlyOnline && !p.sellOnline) return false;
      if (storage.length && !storage.includes(p.storage)) return false;
      if (colors.length && !colors.includes(p.color)) return false;
      if (location && p.location !== location) return false;
      if (terms.length) {
        const hay = norm(`${p.name} ${p.category} ${p.storage} ${p.color} ${p.description}`);
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const byPrice = (a: Product, b: Product) => (a.priceUsd || Infinity) - (b.priceUsd || Infinity);
    switch (sort) {
      case "precio-asc": return [...list].sort(byPrice);
      case "precio-desc": return [...list].sort((a, b) => b.priceUsd - a.priceUsd);
      case "nuevos": return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      default: return list;
    }
  }, [scoped, estado, onlyStock, onlyOnline, storage, colors, location, q, sort]);

  const activeFilters = storage.length + colors.length + (location ? 1 : 0) + (onlyOnline ? 1 : 0) + (onlyStock ? 0 : 1);
  const clearAll = () => {
    setStorage([]);
    setColors([]);
    setLocation("");
    setOnlyOnline(false);
    setOnlyStock(true);
    setQ("");
    router.replace(lockedCategory ? pathname : `${pathname}`, { scroll: false });
  };

  const filterPanel = (
    <div className="space-y-8">
      {!lockedCategory && (
        <FilterGroup title="Estado">
          <div className="flex flex-wrap gap-2">
            {["", "Nuevo", "Usado"].map((e) => (
              <Chip key={e || "todos"} active={estado === e} onClick={() => setParam("estado", e)}>
                {e === "" ? "Todos" : e === "Nuevo" ? "Nuevos / Sellados" : "Usados"}
              </Chip>
            ))}
          </div>
        </FilterGroup>
      )}
      {facets.storage.length > 1 && (
        <FilterGroup title="Capacidad">
          <div className="flex flex-wrap gap-2">
            {facets.storage.map((s) => (
              <Chip key={s} active={storage.includes(s)} onClick={() => setStorage(toggle(storage, s))}>{s}</Chip>
            ))}
          </div>
        </FilterGroup>
      )}
      {facets.colors.length > 1 && (
        <FilterGroup title="Color">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => (
              <Chip key={c} active={colors.includes(c)} onClick={() => setColors(toggle(colors, c))}>{c}</Chip>
            ))}
          </div>
        </FilterGroup>
      )}
      {facets.locations.length > 1 && (
        <FilterGroup title="Sucursal">
          <div className="flex flex-wrap gap-2">
            <Chip active={!location} onClick={() => setLocation("")}>Todas</Chip>
            {facets.locations.map((l) => (
              <Chip key={l} active={location === l} onClick={() => setLocation(l)}>{l.charAt(0) + l.slice(1).toLowerCase()}</Chip>
            ))}
          </div>
        </FilterGroup>
      )}
      <FilterGroup title="Disponibilidad">
        <Toggle checked={onlyStock} onChange={setOnlyStock} label="Solo con stock" />
        <Toggle checked={onlyOnline} onChange={setOnlyOnline} label="Compra online" />
      </FilterGroup>
      {activeFilters > 0 && (
        <button onClick={clearAll} className="text-sm font-medium text-ink hover:underline">Limpiar filtros</button>
      )}
    </div>
  );

  return (
    <div>
      {/* Barra superior: categorías + búsqueda + orden */}
      <div className="sticky top-[72px] z-30 -mx-4 border-b border-line bg-paper/90 px-4 py-3  sm:mx-0 sm:rounded-[20px] sm:border sm:bg-card/80 sm:px-4">
        {!lockedCategory && (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-3">
            <Chip active={!cat} onClick={() => setParam("cat", "")}>Todo</Chip>
            {categories.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setParam("cat", c)}>{c}</Chip>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lockedCategory ? "Buscar accesorios…" : "Buscar en el catálogo…"}
              className="h-11 w-full rounded-[10px] border border-line bg-card pl-11 pr-10 text-sm outline-none transition focus:border-ink"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Borrar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[10px] p-1 text-faint hover:bg-alt">
                <X size={16} />
              </button>
            )}
          </label>
          <select
            value={sort}
            onChange={(e) => setParam("orden", e.target.value === "relevancia" ? "" : e.target.value)}
            className="hidden h-11 rounded-[10px] border border-line bg-card px-4 text-sm font-medium outline-none sm:block"
            aria-label="Ordenar"
          >
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button
            onClick={() => setFiltersOpen(true)}
            className="relative flex h-11 items-center gap-2 rounded-[10px] border border-line bg-card px-4 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal size={16} /> Filtros
            {activeFilters > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] text-paper">{activeFilters}</span>}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[220px]">{filterPanel}</div>
        </aside>

        <div>
          <p className="mb-5 text-sm text-muted">
            {results.length} {results.length === 1 ? "producto" : "productos"}
            {cat && !lockedCategory && <> en <span className="font-medium text-ink">{cat}</span></>}
          </p>
          {results.length === 0 ? (
            <div className="flex flex-col items-center rounded-[20px] bg-card px-6 py-20 text-center border border-line">
              <PackageSearch size={48} className="text-faint" />
              <p className="text-display mt-5 text-2xl">No encontramos productos</p>
              <p className="mt-2 max-w-sm text-muted">Probá con otra búsqueda o sacá algún filtro. También podés consultarnos por WhatsApp.</p>
              <button onClick={clearAll} className="mt-6 rounded-[10px] bg-ink px-5 py-2.5 text-sm font-medium text-paper">Limpiar filtros</button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {results.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ProductCard product={p} priority={i < 6} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Filtros mobile (bottom sheet) */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div className="fixed inset-0 z-[70] bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFiltersOpen(false)} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[71] max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-card px-6 pb-8 pt-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-display text-2xl">Filtros</h2>
                <select
                  value={sort}
                  onChange={(e) => setParam("orden", e.target.value === "relevancia" ? "" : e.target.value)}
                  className="h-10 rounded-[10px] border border-line bg-card px-3 text-sm"
                  aria-label="Ordenar"
                >
                  {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              {filterPanel}
              <button onClick={() => setFiltersOpen(false)} className="mt-8 h-12 w-full rounded-[10px] bg-ink font-medium text-paper">
                Ver {results.length} productos
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-muted">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-[10px] px-4 py-2 text-sm font-medium transition",
        active ? "bg-ink text-paper" : "bg-card text-ink-soft border border-line hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-ink-soft">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-ink" : "bg-line")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-[10px] bg-card shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </label>
  );
}

export function CatalogSkeleton() {
  return (
    <div>
      <div className="skeleton h-28 rounded-[20px]" />
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:ml-[280px]">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-[20px]" />)}
      </div>
    </div>
  );
}
