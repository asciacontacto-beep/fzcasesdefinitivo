import "server-only";
import type { DolarCasa } from "./types";

export interface DolarQuote {
  casa: DolarCasa;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

/** Cotización de dolarapi.com. Devuelve null si no responde (se usa la manual). */
export async function fetchDolar(casa: DolarCasa): Promise<DolarQuote | null> {
  try {
    const r = await fetch(`https://dolarapi.com/v1/dolares/${casa}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const q = (await r.json()) as DolarQuote;
    return Number(q.venta) > 0 ? q : null;
  } catch {
    return null;
  }
}

export async function fetchAllDolares(): Promise<DolarQuote[]> {
  try {
    const r = await fetch("https://dolarapi.com/v1/dolares", { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!r.ok) return [];
    return (await r.json()) as DolarQuote[];
  } catch {
    return [];
  }
}
