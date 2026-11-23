import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** Lecturas públicas desde el servidor (respeta RLS como un visitante). */
export async function rest<T = unknown>(path: string): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`supabase ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

let _admin: SupabaseClient | null = null;

/**
 * Cliente con service role: saltea RLS. SOLO para código de servidor que
 * necesita escribir pedidos (checkout, webhook). Nunca importarlo en un
 * componente de cliente.
 */
export function supabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno (Supabase → Project Settings → API).",
    );
  }
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
  }
  return _admin;
}

/** Valida el access token de un usuario logueado en el panel. */
export async function getUserFromToken(token: string | null | undefined) {
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
