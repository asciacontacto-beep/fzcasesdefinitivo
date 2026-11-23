// GET /api/img?id=123&slot=1|2|3|v0..vN
//
// Sirve como binario las fotos que todavía están guardadas como base64 en la
// tabla products. La respuesta se cachea fuerte en el CDN, así Supabase la
// entrega una sola vez por foto en lugar de una vez por visitante.
// Después de correr scripts/migrate-images.mjs esta ruta deja de usarse.
import { rest } from "@/lib/supabase/server";

const SLOTS: Record<string, string> = { "1": "imagen", "2": "imagen2", "3": "imagen3" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  const slot = searchParams.get("slot") ?? "1";
  if (!Number.isFinite(id) || id <= 0) return new Response("id inválido", { status: 400 });

  const variantIdx = slot.startsWith("v") ? Number(slot.slice(1)) : null;
  const column = variantIdx !== null ? "variantes" : SLOTS[slot];
  if (!column || (variantIdx !== null && !Number.isInteger(variantIdx))) {
    return new Response("slot inválido", { status: 400 });
  }

  try {
    const rows = await rest<Record<string, unknown>[]>(`products?select=${column}&id=eq.${id}&limit=1`);
    const value = rows[0]?.[column];
    const dataUrl =
      variantIdx !== null
        ? (value as { imagen?: string }[] | null)?.[variantIdx]?.imagen
        : (value as string | null);

    // La foto ya está en Storage (o es una ruta): redirigir ahí
    if (typeof dataUrl === "string" && dataUrl && !dataUrl.startsWith("data:")) {
      const target = /^(https?:)?\/\//.test(dataUrl) ? dataUrl : `/${dataUrl.replace(/^\.?\//, "")}`;
      return new Response(null, { status: 302, headers: { Location: new URL(target, request.url).toString(), "Cache-Control": "public, max-age=300" } });
    }
    const m = typeof dataUrl === "string" ? /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl) : null;
    if (!m) return snapshotRedirect(request, id, slot);

    const body = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));
    return new Response(body, {
      headers: {
        "Content-Type": m[1] || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=31536000",
      },
    });
  } catch {
    return snapshotRedirect(request, id, slot);
  }
}

function snapshotRedirect(request: Request, id: number, slot: string) {
  if (!/^[123]$/.test(slot)) return new Response("sin foto", { status: 404 });
  return Response.redirect(new URL(`/snapshot/img/${id}-${slot}.jpg`, request.url), 302);
}
