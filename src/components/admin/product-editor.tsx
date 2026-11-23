"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { mutate } from "swr";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { fetchProductExtras, useProducts, useSchemaStatus, useSettings, type ProductRow } from "@/lib/admin/data";
import { composeUnitNotes, emptyUnit, rowToUnits, unitToVariant, type Unit } from "@/lib/admin/units";
import { revalidateStore } from "@/lib/admin/revalidate";
import { formatUsd, productHref } from "@/lib/format";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, Dialog, Field, Notice, Segmented, Switch } from "./ui";
import { ImageSlot } from "./image-slot";
import { UnitsEditor } from "./units-editor";

const CATEGORIES = ["iPhone", "Samsung", "iPad", "MacBook", "Apple Watch", "AirPods", "Accesorios"];
const isSimpleStock = (cat: string) => cat === "Accesorios";

interface FormState {
  nombre: string;
  categoria: string;
  condicion: "Nuevo" | "Usado";
  ubicacion: string;
  precioVenta: string;
  precioCosto: string;
  descripcion: string;
  activo: boolean;
  destacado: boolean;
  nuevoIngreso: boolean;
  ventaOnline: boolean;
  fotos: [string | null, string | null, string | null];
  // Accesorios: stock numérico simple
  stock: string;
  color: string;
  capacidad: string;
  // Equipos: unidades
  units: Unit[];
}

const blank = (): FormState => ({
  nombre: "",
  categoria: "iPhone",
  condicion: "Nuevo",
  ubicacion: "NECOCHEA",
  precioVenta: "",
  precioCosto: "",
  descripcion: "",
  activo: true,
  destacado: false,
  nuevoIngreso: true,
  ventaOnline: false,
  fotos: [null, null, null],
  stock: "1",
  color: "",
  capacidad: "",
  units: [emptyUnit()],
});

export function ProductEditor({ id }: { id: number | null }) {
  const router = useRouter();
  const { data: products } = useProducts();
  const { data: schema } = useSchemaStatus();
  const { data: settings } = useSettings();
  const [form, setForm] = useState<FormState | null>(id === null ? blank() : null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const row = useMemo(() => products?.find((p) => p.id === id) ?? null, [products, id]);

  // Cargar el producto (y sus fotos extra / unidades, que no vienen en el listado)
  useEffect(() => {
    if (id === null || !row || form) return;
    let cancelled = false;
    fetchProductExtras(id)
      .then((extra) => {
        if (cancelled) return;
        const notas = row.notas ?? "";
        setForm({
          nombre: row.nombre,
          categoria: row.categoria,
          condicion: row.subcategoria === "Usado" ? "Usado" : "Nuevo",
          ubicacion: row.ubicacion ?? "",
          precioVenta: row.precio_venta ? String(row.precio_venta) : "",
          precioCosto: row.precio_costo ? String(row.precio_costo) : "",
          descripcion: row.descripcion ?? "",
          activo: row.activo !== false,
          destacado: row.destacado ?? notas.includes("[DESTACADO]"),
          nuevoIngreso: row.nuevo_ingreso ?? notas.includes("[NUEVO]"),
          ventaOnline: row.venta_online ?? row.categoria === "Accesorios",
          fotos: [row.imagen && row.imagen !== "/assets/iphone_case.png" ? row.imagen : null, extra.imagen2, extra.imagen3],
          stock: String(row.stock ?? 0),
          color: row.color ?? "",
          capacidad: row.almacenamiento && row.almacenamiento !== "-" ? row.almacenamiento : "",
          units: rowToUnits(row, extra.variantes),
        });
      })
      .catch((e) => toast.error(`No se pudo cargar el producto: ${e.message}`));
    return () => {
      cancelled = true;
    };
  }, [id, row, form]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  // En la base hay "TANDIL" y "Tandil": se agrupan sin importar mayúsculas.
  const currentLocation = form?.ubicacion ?? "";
  const locations = useMemo(() => {
    const byKey = new Map([["NECOCHEA", "NECOCHEA"], ["TANDIL", "TANDIL"]]);
    products?.forEach((p) => p.ubicacion && !byKey.has(p.ubicacion.toUpperCase()) && byKey.set(p.ubicacion.toUpperCase(), p.ubicacion));
    const list = [...byKey.values()];
    // Si el producto tiene una variante de mayúsculas distinta, se respeta la suya
    if (currentLocation && !list.includes(currentLocation)) {
      return list.map((l) => (l.toUpperCase() === currentLocation.toUpperCase() ? currentLocation : l));
    }
    return list;
  }, [products, currentLocation]);

  const categories = useMemo(() => {
    const s = new Set(CATEGORIES);
    products?.forEach((p) => p.categoria && p.categoria !== "Sistema" && s.add(p.categoria));
    return [...s];
  }, [products]);

  if (id !== null && products && !row) {
    return <Notice>No existe un producto con el número {id}. <Link href="/admin/productos" className="underline">Volver al listado</Link></Notice>;
  }
  if (!form) return <EditorSkeleton />;

  const simple = isSimpleStock(form.categoria);
  const models = settings?.site.customModels?.[form.categoria] ?? [];
  const venta = Number(form.precioVenta) || 0;
  const costo = Number(form.precioCosto) || 0;
  const margen = venta > 0 && costo > 0 ? venta - costo : null;

  const save = async () => {
    if (!form.nombre.trim()) return toast.error("Falta el nombre del producto.");
    if (!simple && form.units.length === 0) return toast.error("Agregá al menos una unidad.");
    setSaving(true);
    try {
      const flagsInNotes = (n: string) =>
        [n.replace(/\[(DESTACADO|NUEVO)\]/g, "").trim(), form.destacado && "[DESTACADO]", form.nuevoIngreso && "[NUEVO]"].filter(Boolean).join(" ");

      const main = form.units[0];
      const payload: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        subcategoria: form.condicion,
        ubicacion: form.ubicacion || null,
        precio_venta: venta,
        precio_costo: costo,
        descripcion: form.descripcion.trim() || null,
        activo: form.activo,
        imagen: form.fotos[0] ?? main?.image ?? null,
        imagen2: form.fotos[1],
        imagen3: form.fotos[2],
        ...(simple
          ? {
              stock: Math.max(0, Number.parseInt(form.stock, 10) || 0),
              color: form.color || null,
              almacenamiento: form.capacidad || "-",
              battery: null,
              variantes: null,
              notas: flagsInNotes(row ? (row.notas ?? "") : ""),
            }
          : {
              stock: form.units.length,
              color: main.color,
              almacenamiento: main.storage || "-",
              battery: form.condicion === "Usado" ? main.battery : null,
              notas: flagsInNotes(composeUnitNotes(main)),
              variantes: form.units.length > 1 ? form.units.slice(1).map(unitToVariant) : null,
            }),
      };
      // Columnas nuevas (si ya se corrió la migración). Las etiquetas en notas
      // se mantienen igual para que el sitio viejo también las vea.
      if (schema?.productFlags) {
        payload.destacado = form.destacado;
        payload.nuevo_ingreso = form.nuevoIngreso;
        payload.venta_online = form.ventaOnline;
        payload.updated_at = new Date().toISOString();
      }

      const sb = supabaseBrowser();
      let savedId = id;
      if (id === null) {
        const maxOrden = (products ?? []).reduce((m, p) => Math.max(m, p.orden ?? 0), 0);
        const { data, error } = await sb.from("products").insert([{ ...payload, orden: maxOrden + 10 }]).select("id").single();
        if (error) throw error;
        savedId = data.id as number;
      } else {
        const { error } = await sb.from("products").update(payload).eq("id", id);
        if (error) throw error;
      }
      await Promise.all([mutate("admin/products"), revalidateStore(["catalog"], savedId ? [savedId] : [])]);
      toast.success(id === null ? "Producto creado" : "Cambios guardados");
      if (id === null && savedId) router.replace(`/admin/productos/${savedId}`);
    } catch (e) {
      toast.error(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (id === null) return;
    const { error } = await supabaseBrowser().from("products").delete().eq("id", id);
    if (error) return toast.error(`No se pudo eliminar: ${error.message}`);
    await Promise.all([mutate("admin/products"), revalidateStore(["catalog"])]);
    toast.success("Producto eliminado");
    router.replace("/admin/productos");
  };

  return (
    <div className="pb-28">
      <Link href="/admin/productos" className="mb-6 inline-flex items-center gap-2 text-[15px] text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Productos
      </Link>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-display text-[32px] md:text-[40px]">{id === null ? "Nuevo producto" : form.nombre || "Producto"}</h1>
        {row && (
          <a href={productHref({ id: row.id, name: row.nombre })} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-[15px] font-medium">
            <span className="link-draw">Ver en la tienda</span> <ExternalLink size={15} />
          </a>
        )}
      </div>

      {schema && !schema.productFlags && (
        <div className="mb-6">
          <Notice>Falta correr la migración 001: “Destacado” y “Nuevo ingreso” se guardan en las notas, y “Venta online” no está disponible.</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Datos">
            <div className="grid gap-5 p-6 md:grid-cols-2">
              <Field label="Categoría">
                <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} className="input">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Nombre o modelo" hint={models.length ? "Elegí un modelo de la lista o escribí uno nuevo." : undefined}>
                <input list="dl-models" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} className="input" placeholder="iPhone 15 Pro" />
                <datalist id="dl-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
              </Field>
              <Field label="Estado">
                <div>
                  <Segmented
                    value={form.condicion}
                    onChange={(v) => set("condicion", v)}
                    options={[{ value: "Nuevo", label: form.categoria === "Accesorios" ? "Nuevo" : "Sellado" }, { value: "Usado", label: "Usado" }]}
                  />
                </div>
              </Field>
              <Field label="Sucursal">
                <select value={form.ubicacion} onChange={(e) => set("ubicacion", e.target.value)} className="input">
                  {locations.map((l) => <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>)}
                </select>
              </Field>
              <Field label="Precio de venta (US$)" hint="Dejalo en 0 para mostrar “Precio por WhatsApp”.">
                <input inputMode="decimal" value={form.precioVenta} onChange={(e) => set("precioVenta", e.target.value.replace(/[^\d.]/g, ""))} className="input" placeholder="0" />
              </Field>
              <Field label="Costo (US$)" hint={margen !== null ? `Margen: ${formatUsd(margen)} (${Math.round((margen / venta) * 100)}%)` : "Solo lo ves vos, no se publica."}>
                <input inputMode="decimal" value={form.precioCosto} onChange={(e) => set("precioCosto", e.target.value.replace(/[^\d.]/g, ""))} className="input" placeholder="0" />
              </Field>
              <Field label="Descripción" className="md:col-span-2">
                <textarea rows={4} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} className="input" placeholder="Condiciones de venta, compatibilidad, qué incluye…" />
              </Field>
            </div>
          </Card>

          <Card title={simple ? "Stock" : `Unidades en stock (${form.units.length})`}>
            <div className="p-6">
              {simple ? (
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Cantidad en stock">
                    <input inputMode="numeric" value={form.stock} onChange={(e) => set("stock", e.target.value.replace(/[^\d]/g, ""))} className="input" />
                  </Field>
                  <Field label="Color">
                    <input value={form.color} onChange={(e) => set("color", e.target.value)} className="input" placeholder="Blanco" />
                  </Field>
                  <Field label="Capacidad / medida">
                    <input value={form.capacidad} onChange={(e) => set("capacidad", e.target.value)} className="input" placeholder="20W, 1 m…" />
                  </Field>
                </div>
              ) : (
                <UnitsEditor units={form.units} onChange={(u) => set("units", u)} showBattery={form.condicion === "Usado"} productId={id} />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Fotos">
            <div className="grid grid-cols-3 gap-3 p-6 xl:grid-cols-2">
              {([0, 1, 2] as const).map((i) => (
                <ImageSlot
                  key={i}
                  value={form.fotos[i]}
                  label={i === 0 ? "Foto principal" : `Foto ${i + 1}`}
                  folder={`products/${id ?? "nuevo"}`}
                  onChange={(url) => {
                    const f = [...form.fotos] as FormState["fotos"];
                    f[i] = url;
                    set("fotos", f);
                  }}
                  className={i === 0 ? "xl:col-span-2" : undefined}
                />
              ))}
            </div>
          </Card>

          <Card title="Publicación">
            <div className="space-y-5 p-6">
              <Switch checked={form.activo} onChange={(v) => set("activo", v)} label="Visible en la tienda" />
              <Switch checked={form.destacado} onChange={(v) => set("destacado", v)} label="Destacado" hint="Aparece en “Destacados” de la portada." />
              <Switch checked={form.nuevoIngreso} onChange={(v) => set("nuevoIngreso", v)} label="Nuevo ingreso" hint="Aparece en “Últimos ingresos”." />
              <Switch
                checked={form.ventaOnline}
                onChange={(v) => set("ventaOnline", v)}
                label="Venta online"
                hint={schema?.productFlags ? "Se puede agregar al carrito y pagar online. Necesita precio." : "Disponible después de la migración."}
              />
            </div>
          </Card>

          {id !== null && (
            <button onClick={() => setConfirmDelete(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-medium text-danger hover:bg-[#f5e2df]">
              <Trash2 size={16} /> Eliminar producto
            </button>
          )}
        </div>
      </div>

      {/* Barra de guardado fija */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper lg:left-[248px]">
        <div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-8 lg:px-10">
          <Link href="/admin/productos" className={buttonClass("secondary")}>Cancelar</Link>
          <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : id === null ? "Crear producto" : "Guardar cambios"}</Button>
        </div>
      </div>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Eliminar producto">
        <p className="text-ink-soft">
          Se borra <strong className="text-ink">{form.nombre}</strong> con sus {simple ? "datos" : `${form.units.length} unidades`} y fotos. No se puede deshacer.
          Si solo querés que no se vea, apagá “Visible en la tienda”.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <button onClick={remove} className="h-11 rounded-[10px] bg-danger px-6 text-[15px] font-medium text-white">Eliminar</button>
        </div>
      </Dialog>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-64 rounded" />
      <div className="skeleton h-80 rounded-[20px]" />
      <div className="skeleton h-60 rounded-[20px]" />
    </div>
  );
}

export type { ProductRow };
