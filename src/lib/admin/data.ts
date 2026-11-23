"use client";
import useSWR from "swr";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { OrderRow, ShopSettings } from "@/lib/types";

// ---------------------------------------------------------------------------
// Filas tal cual están en la DB (el panel trabaja directo con ellas)
// ---------------------------------------------------------------------------

export interface UnitRow {
  color: string;
  almacenamiento: string;
  bateria: string;
  notas: string;
  imagen: string | null;
}

export interface ProductRow {
  id: number;
  nombre: string;
  categoria: string;
  subcategoria: string | null;
  almacenamiento: string | null;
  color: string | null;
  battery: string | null;
  precio_venta: number | null;
  precio_costo: number | null;
  stock: number | null;
  ubicacion: string | null;
  activo: boolean | null;
  orden: number | null;
  notas: string | null;
  descripcion: string | null;
  imagen: string | null;
  created_at: string;
  destacado?: boolean;
  nuevo_ingreso?: boolean;
  venta_online?: boolean;
}

export interface SaleRow {
  id: number;
  producto_id: number | null;
  producto_nombre: string;
  cantidad: number;
  precio_final: number;
  precio_costo: number;
  cliente: string | null;
  metodo_pago: string | null;
  fecha: string;
}

export interface EventRow {
  id: number;
  tipo: string;
  pagina: string | null;
  datos: Record<string, unknown> | null;
  created_at: string;
}

export const SYSTEM_NAMES = ["__SYSTEM_HERO__", "__CONFIG_HERO__", "__CONFIG_SETTINGS__"];
const BASE =
  "id,nombre,categoria,subcategoria,almacenamiento,color,battery,precio_venta,precio_costo,stock," +
  "ubicacion,activo,orden,notas,descripcion,imagen,created_at";
const FLAGS = ",destacado,nuevo_ingreso,venta_online";

const sb = () => supabaseBrowser();

/** ¿Ya se corrió la migración 001? (columnas nuevas, settings, orders, storage) */
export async function fetchSchemaStatus() {
  const [cols, settings, orders] = await Promise.all([
    sb().from("products").select("destacado").limit(1),
    sb().from("settings").select("key").limit(1),
    sb().from("orders").select("id").limit(1),
  ]);
  return { productFlags: !cols.error, settings: !settings.error, orders: !orders.error };
}

export async function fetchProducts(): Promise<ProductRow[]> {
  let res = await sb().from("products").select(BASE + FLAGS).order("orden", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
  if (res.error && res.error.message.includes("column")) {
    res = await sb().from("products").select(BASE).order("orden", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
  }
  if (res.error) throw res.error;
  return (res.data as unknown as ProductRow[]) ?? [];
}

export async function fetchProductExtras(id: number) {
  const { data, error } = await sb().from("products").select("imagen2,imagen3,variantes").eq("id", id).single();
  if (error) throw error;
  return data as { imagen2: string | null; imagen3: string | null; variantes: UnitRow[] | null };
}

export async function fetchSales(): Promise<SaleRow[]> {
  const { data, error } = await sb().from("sales").select("*").order("fecha", { ascending: false });
  if (error) throw error;
  return data as SaleRow[];
}

export async function fetchEvents(sinceIso: string): Promise<EventRow[]> {
  const { data, error } = await sb()
    .from("eventos_analytics")
    .select("id,tipo,pagina,datos,created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(20000);
  if (error) return [];
  return data as EventRow[];
}

export async function fetchOrders(): Promise<OrderRow[] | null> {
  const { data, error } = await sb().from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(500);
  if (error) return null; // tabla todavía no creada
  return data as OrderRow[];
}

// ---------------------------------------------------------------------------
// Hooks (SWR: cachea entre pantallas y revalida al volver a la pestaña)
// ---------------------------------------------------------------------------

export const useProducts = () => useSWR("admin/products", fetchProducts);
export const useSales = () => useSWR("admin/sales", fetchSales);
export const useOrders = () => useSWR("admin/orders", fetchOrders, { refreshInterval: 60_000 });
export const useSchemaStatus = () => useSWR("admin/schema", fetchSchemaStatus, { revalidateOnFocus: false });
export const useEvents = (days: number) =>
  useSWR(["admin/events", days], () => {
    const since = new Date(Date.now() - days * 86_400_000);
    since.setHours(0, 0, 0, 0);
    return fetchEvents(since.toISOString());
  });

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SiteSettingsRaw {
  heroTitle?: string;
  heroSubtitle?: string;
  heroSlides?: string[];
  logoUrl?: string | null;
  canjeTitle?: string;
  canjeSubtitle?: string;
  categoryNav?: { enabled: boolean; items: { name: string; url: string; imgUrl: string; active: boolean }[] };
  customModels?: Record<string, string[]>;
  [k: string]: unknown;
}

export interface SettingsBundle {
  site: SiteSettingsRaw;
  shop: Partial<ShopSettings> | null;
  hasTable: boolean;
  legacyHero: { id: number; imagen: string | null; activo: boolean | null }[];
}

export async function fetchSettings(): Promise<SettingsBundle> {
  const [table, legacy, hero] = await Promise.all([
    sb().from("settings").select("key,value"),
    sb().from("products").select("id,notas").eq("nombre", "__CONFIG_SETTINGS__").order("id").limit(1),
    sb().from("products").select("id,imagen,activo").eq("nombre", "__SYSTEM_HERO__").order("id"),
  ]);
  const hasTable = !table.error;
  const map = Object.fromEntries((table.data ?? []).map((r) => [r.key, r.value]));
  let site: SiteSettingsRaw = (map.site as SiteSettingsRaw) ?? {};
  if (!map.site && legacy.data?.[0]?.notas) {
    try {
      site = JSON.parse(legacy.data[0].notas);
    } catch {}
  }
  return { site, shop: (map.shop as Partial<ShopSettings>) ?? null, hasTable, legacyHero: hero.data ?? [] };
}

export const useSettings = () => useSWR("admin/settings", fetchSettings, { revalidateOnFocus: false });

/**
 * Guarda la config del sitio. Mientras el sitio viejo siga en línea, también
 * actualiza su registro __CONFIG_SETTINGS__ para que los dos muestren lo mismo.
 */
export async function saveSiteSettings(site: SiteSettingsRaw, hasTable: boolean) {
  if (hasTable) {
    const { error } = await sb().from("settings").upsert({ key: "site", value: site, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
  const { data } = await sb().from("products").select("id").eq("nombre", "__CONFIG_SETTINGS__").limit(1);
  const payload = { notas: JSON.stringify(site) };
  if (data?.[0]) await sb().from("products").update(payload).eq("id", data[0].id);
  else if (!hasTable)
    await sb().from("products").insert([{ nombre: "__CONFIG_SETTINGS__", categoria: "Sistema", activo: false, precio_venta: 0, precio_costo: 0, stock: 0, ...payload }]);
}

export async function saveShopSettings(shop: ShopSettings) {
  const { error } = await sb().from("settings").upsert({ key: "shop", value: shop, updated_at: new Date().toISOString() });
  if (error) throw error;
}
