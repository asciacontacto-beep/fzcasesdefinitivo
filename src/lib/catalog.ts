import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { rest } from "./supabase/server";
import { DEFAULT_SHOP_SETTINGS } from "./shop-defaults";
import { fetchDolar } from "./dolar";
import { dataFingerprint, isDataUrl, normalizePath, resolveImage } from "./images";
import type {
  Condition,
  Product,
  ProductDetail,
  ShopSettings,
  SiteSettings,
  Variant,
} from "./types";

// ---------------------------------------------------------------------------
// Filas crudas de la tabla products
// ---------------------------------------------------------------------------
interface ProductRow {
  id: number;
  nombre: string;
  categoria: string;
  subcategoria: string | null;
  almacenamiento: string | null;
  color: string | null;
  precio_venta: number | null;
  battery: string | null;
  ubicacion: string | null;
  notas: string | null;
  descripcion: string | null;
  imagen: string | null;
  stock: number | null;
  activo: boolean | string | null;
  created_at: string;
  orden: number | null;
  has_img?: boolean;
  destacado?: boolean;
  nuevo_ingreso?: boolean;
  venta_online?: boolean;
}

const BASE_FIELDS =
  "id,nombre,categoria,subcategoria,almacenamiento,color,precio_venta,battery," +
  "ubicacion,notas,descripcion,imagen,stock,activo,created_at,orden";
const NEW_FIELDS = ",destacado,nuevo_ingreso,venta_online";
const ORDER = "&order=orden.asc.nullslast,created_at.desc";

export const SYSTEM_NAMES = new Set(["__SYSTEM_HERO__", "__CONFIG_HERO__", "__CONFIG_SETTINGS__"]);

const SNAPSHOT_DIR = path.join(process.cwd(), "public", "snapshot");

function readSnapshot<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, file), "utf8")) as T;
  } catch {
    return null;
  }
}

let _snapshotIndex: Record<string, string> | null = null;
function snapshotImage(id: number, slot: number): string | null {
  _snapshotIndex ??= readSnapshot<Record<string, string>>("index.json") ?? {};
  const f = _snapshotIndex[`${id}-${slot}`];
  return f ? `/snapshot/img/${f}` : null;
}

/** Trae todas las filas. Si la migración 001 todavía no corrió, cae a los campos viejos. */
async function fetchRows(): Promise<{ rows: ProductRow[]; fromSnapshot: boolean }> {
  try {
    try {
      return { rows: await rest<ProductRow[]>(`products?select=${BASE_FIELDS}${NEW_FIELDS}${ORDER}`), fromSnapshot: false };
    } catch (e) {
      if (!String(e).includes("column")) throw e;
      return { rows: await rest<ProductRow[]>(`products?select=${BASE_FIELDS}${ORDER}`), fromSnapshot: false };
    }
  } catch (err) {
    console.error("[catalog] Supabase no respondió, uso snapshot:", err);
    return { rows: readSnapshot<ProductRow[]>("catalog.json") ?? [], fromSnapshot: true };
  }
}

const TAG_RE = /\[(DESTACADO|NUEVO)\]/g;

function toProduct(r: ProductRow, fromSnapshot: boolean): Product {
  const notas = r.notas ?? "";
  const condition: Condition = r.subcategoria === "Usado" ? "Usado" : "Nuevo";
  let image = resolveImage(r.imagen, r.id, 1);
  if (!image && (fromSnapshot || r.has_img)) image = snapshotImage(r.id, 1);
  return {
    id: r.id,
    name: r.nombre,
    category: r.categoria,
    condition,
    storage: r.almacenamiento && r.almacenamiento !== "-" ? r.almacenamiento : "",
    color: r.color ?? "",
    priceUsd: Number(r.precio_venta) || 0,
    battery: r.battery ?? "",
    location: r.ubicacion ?? "",
    notes: notas.replace(TAG_RE, "").trim(),
    description: r.descripcion ?? "",
    image,
    stock: Number(r.stock) || 0,
    order: r.orden ?? 0,
    featured: r.destacado ?? notas.includes("[DESTACADO]"),
    isNew: r.nuevo_ingreso ?? notas.includes("[NUEVO]"),
    // Sin precio cargado no se puede cobrar online: queda como consulta por WhatsApp.
    sellOnline: (r.venta_online ?? r.categoria === "Accesorios") && Number(r.precio_venta) > 0,
    createdAt: r.created_at,
  };
}

// ---------------------------------------------------------------------------
// API pública de datos (cacheada; el admin invalida con el tag "catalog")
// ---------------------------------------------------------------------------

async function loadAll() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  const { rows, fromSnapshot } = await fetchRows();
  // No guardar los base64 en caché: alcanza con saber que hay foto ("data:")
  // y se sirve aparte por /api/img (cacheado en el CDN).
  for (const r of rows) if (isDataUrl(r.imagen)) r.imagen = `data:${dataFingerprint(r.imagen)}`;
  return { rows, fromSnapshot };
}

export async function getProducts(): Promise<Product[]> {
  const { rows, fromSnapshot } = await loadAll();
  return rows
    .filter((r) => (r.activo === true || r.activo === "true") && !SYSTEM_NAMES.has(r.nombre) && r.categoria !== "Sistema")
    .map((r) => toProduct(r, fromSnapshot));
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts();
  const order = ["iPhone", "Samsung", "iPad", "MacBook", "Apple Watch", "AirPods", "Accesorios"];
  const set = new Set(products.map((p) => p.category));
  return [...order.filter((c) => set.has(c)), ...[...set].filter((c) => !order.includes(c))];
}

interface DetailRow {
  imagen2: string | null;
  imagen3: string | null;
  variantes: Array<{
    color?: string;
    almacenamiento?: string;
    bateria?: string;
    notas?: string;
    imagen?: string | null;
  }> | null;
}

export async function getProductDetail(id: number): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", `product-${id}`);

  const products = await getProducts();
  const base = products.find((p) => p.id === id);
  if (!base) return null;

  let detail: DetailRow | null = null;
  try {
    const rows = await rest<DetailRow[]>(`products?select=imagen2,imagen3,variantes&id=eq.${id}&limit=1`);
    detail = rows[0] ?? null;
  } catch {
    const snap = readSnapshot<{ variantes: DetailRow["variantes"]; has_img2?: boolean; has_img3?: boolean; imagen2?: string | null; imagen3?: string | null }>(`detail/${id}.json`);
    if (snap) {
      detail = {
        imagen2: snap.imagen2 ?? (snap.has_img2 ? `/snapshot/img/${id}-2.jpg` : null),
        imagen3: snap.imagen3 ?? (snap.has_img3 ? `/snapshot/img/${id}-3.jpg` : null),
        variantes: snap.variantes,
      };
    }
  }

  const images = [
    base.image,
    resolveImage(detail?.imagen2, id, 2),
    resolveImage(detail?.imagen3, id, 3),
  ].filter((x): x is string => !!x);

  const variants: Variant[] = (detail?.variantes ?? []).map((v, i) => ({
    color: v.color ?? "",
    storage: v.almacenamiento ?? "",
    battery: v.bateria ?? "",
    notes: v.notas ?? "",
    // Las fotos de variantes en base64 se sirven por /api/img con slot "v<i>"
    image: resolveImage(v.imagen, id, `v${i}`),
  }));

  return { ...base, images, variants };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const DEFAULT_SITE: SiteSettings = {
  heroTitle: "iPhone y equipos Apple en Tandil y Necochea",
  heroSubtitle: "Sellados con 12 meses de garantía oficial Apple, y usados de clientes que revisamos uno por uno.",
  heroSlides: ["/assets/hero-fz.jpg"],
  logoUrl: null,
  categoryNav: { enabled: true, items: [] },
  customModels: {},
  canjeTitle: "¿Querés cambiar tu iPhone?",
  canjeSubtitle: "Tasamos tu equipo usado al instante y te ayudamos a renovar al modelo que siempre quisiste.",
};

export const DEFAULT_SHOP: ShopSettings = DEFAULT_SHOP_SETTINGS;

type RawSite = Partial<SiteSettings> & { heroColor?: string; animatedBgEnabled?: boolean };

function normalizeSite(raw: RawSite, legacyHeroSlides: string[]): SiteSettings {
  const items = (raw.categoryNav?.items ?? []).map((it) => {
    // El sitio viejo guardaba links tipo "catalogo.html?cat=iPhone"
    const url = it.url?.startsWith("http")
      ? it.url
      : "/" + (it.url ?? "").replace(/^\/?catalogo\.html/, "catalogo").replace(/^\//, "");
    const img = isDataUrl(it.imgUrl)
      ? `/api/category-img?name=${encodeURIComponent(it.name)}`
      : it.imgUrl
        ? normalizePath(it.imgUrl)
        : "";
    return { ...it, url: /^https?:\/\/.*\.(png|jpe?g|webp)/i.test(url) ? `/catalogo?cat=${encodeURIComponent(it.name)}` : url, imgUrl: img };
  });
  const slides = (raw.heroSlides?.length ? raw.heroSlides : legacyHeroSlides).map(normalizePath);
  return {
    ...DEFAULT_SITE,
    heroTitle: raw.heroTitle || DEFAULT_SITE.heroTitle,
    heroSubtitle: raw.heroSubtitle || DEFAULT_SITE.heroSubtitle,
    heroSlides: slides.length ? slides : DEFAULT_SITE.heroSlides,
    logoUrl: raw.logoUrl && !isDataUrl(raw.logoUrl) ? normalizePath(raw.logoUrl) : null,
    categoryNav: { enabled: raw.categoryNav?.enabled ?? true, items },
    customModels: raw.customModels ?? {},
    canjeTitle: raw.canjeTitle || DEFAULT_SITE.canjeTitle,
    canjeSubtitle: raw.canjeSubtitle || DEFAULT_SITE.canjeSubtitle,
  };
}

async function loadSettingsRows(): Promise<Record<string, unknown> | null> {
  try {
    const rows = await rest<{ key: string; value: unknown }[]>("settings?select=key,value");
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return null; // la tabla todavía no existe (migración 001 pendiente)
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const table = await loadSettingsRows();
  const { rows } = await loadAll();
  const legacyHero = rows
    .filter((r) => r.nombre === "__SYSTEM_HERO__" && (r.activo === true || r.activo === "true") && r.imagen)
    .map((r) => resolveImage(r.imagen, r.id, 1)!)
    .filter(Boolean);

  if (table?.site) return normalizeSite(table.site as RawSite, legacyHero);

  const legacy = rows.find((r) => r.nombre === "__CONFIG_SETTINGS__");
  let raw: RawSite = {};
  try {
    raw = legacy?.notas ? JSON.parse(legacy.notas) : {};
  } catch {}
  return normalizeSite(raw, legacyHero);
}

export async function getShopSettings(): Promise<ShopSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  const table = await loadSettingsRows();
  const raw = (table?.shop ?? {}) as Partial<ShopSettings>;
  const shop: ShopSettings = {
    ...DEFAULT_SHOP,
    ...raw,
    bank: { ...DEFAULT_SHOP.bank, ...(raw.bank ?? {}) },
    deliveryOptions: raw.deliveryOptions?.length ? raw.deliveryOptions : DEFAULT_SHOP.deliveryOptions,
  };
  // La config vieja solo tenía usdRate: esa pasa a ser la cotización manual.
  shop.usdManual = Number(raw.usdManual ?? raw.usdRate) || DEFAULT_SHOP.usdManual;
  shop.usdRate = shop.usdManual;
  shop.usdInfo = { source: "manual" };

  if (shop.usdSource === "dolarapi") {
    const q = await fetchDolar(shop.usdCasa);
    if (q) {
      shop.usdRate = Math.round(q.venta + (Number(shop.usdAdjust) || 0));
      shop.usdInfo = { source: "dolarapi", updatedAt: q.fechaActualizacion };
    } else {
      shop.usdInfo = { source: "fallback" };
    }
  }
  return shop;
}
