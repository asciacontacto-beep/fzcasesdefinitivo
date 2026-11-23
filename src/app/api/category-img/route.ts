// GET /api/category-img?name=iPhone
//
// Las imágenes de la tira de categorías que se subieron desde el panel quedaron
// guardadas en base64 dentro de la config. Esta ruta las sirve como binario,
// cacheadas en el CDN, para no meter cientos de KB de base64 en cada página.
import { rest } from "@/lib/supabase/server";

type Item = { name?: string; imgUrl?: string };
type Site = { categoryNav?: { items?: Item[] } };

async function loadSite(): Promise<Site | null> {
  try {
    const rows = await rest<{ value: Site }[]>("settings?select=value&key=eq.site&limit=1");
    if (rows[0]?.value) return rows[0].value;
  } catch {
    // tabla settings todavía no creada: se usa la config vieja
  }
  const rows = await rest<{ notas: string | null }[]>(
    "products?select=notas&nombre=eq.__CONFIG_SETTINGS__&limit=1",
  );
  try {
    return rows[0]?.notas ? (JSON.parse(rows[0].notas) as Site) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name");
  if (!name) return new Response("falta name", { status: 400 });

  try {
    const site = await loadSite();
    const img = site?.categoryNav?.items?.find((i) => i.name === name)?.imgUrl;
    const m = img ? /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(img) : null;
    if (!m) return new Response("sin imagen", { status: 404 });
    const body = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));
    return new Response(body, {
      headers: {
        "Content-Type": m[1] || "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=31536000",
      },
    });
  } catch {
    return new Response("error", { status: 502 });
  }
}
