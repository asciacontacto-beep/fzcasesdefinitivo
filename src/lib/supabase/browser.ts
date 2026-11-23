"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let _client: SupabaseClient | null = null;

/** Cliente del navegador. Lo usa el panel admin (sesión en localStorage). */
export function supabaseBrowser(): SupabaseClient {
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}
