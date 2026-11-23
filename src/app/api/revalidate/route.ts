// POST /api/revalidate  { tags: ["catalog", "settings"] }
// Lo llama el panel después de guardar algo, con el token del usuario logueado,
// para que la tienda muestre el cambio en la próxima visita (sin esperar la caché).
import { revalidateTag } from "next/cache";
import { getUserFromToken } from "@/lib/supabase/server";

const ALLOWED = new Set(["catalog", "settings"]);

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const user = await getUserFromToken(token);
  if (!user) return Response.json({ error: "no autorizado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { tags?: string[]; productIds?: number[] };
  const tags = (body.tags ?? []).filter((t) => ALLOWED.has(t));
  for (const id of body.productIds ?? []) if (Number.isInteger(id)) tags.push(`product-${id}`);
  for (const t of tags) revalidateTag(t, { expire: 0 });
  return Response.json({ ok: true, tags });
}
