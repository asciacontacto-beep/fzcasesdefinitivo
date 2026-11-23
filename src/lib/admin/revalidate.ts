"use client";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** Avisa a la tienda que se guardó algo, para que no muestre la versión en caché. */
export async function revalidateStore(tags: ("catalog" | "settings")[], productIds: number[] = []) {
  const { data } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tags, productIds }),
  }).catch(() => {});
}
