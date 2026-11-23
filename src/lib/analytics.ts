"use client";
import { supabaseBrowser } from "./supabase/browser";

/**
 * Misma tabla que usaba el sitio viejo (eventos_analytics), así el panel sigue
 * mostrando visitas y canjes. Nunca rompe la página si la tabla no existe.
 * Tipos: visita, canje, whatsapp, carrito, checkout.
 */
export function logEvent(tipo: string, datos: Record<string, unknown> | null = null) {
  // En desarrollo no se escribe en la tabla real: ensuciaría las estadísticas.
  if (process.env.NODE_ENV !== "production") return;
  try {
    const pagina = window.location.pathname || "/";
    void supabaseBrowser()
      .from("eventos_analytics")
      .insert([{ tipo, pagina, datos }])
      .then(() => {}, () => {});
  } catch {
    // sin analítica no pasa nada
  }
}
