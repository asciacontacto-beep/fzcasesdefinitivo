// Resolución de URLs de fotos.
//
// Las fotos pueden estar guardadas de 3 formas en la DB:
//   - data URL base64 (lo viejo: pesado, no se manda nunca al navegador)
//   - ruta relativa del sitio viejo ("assets/x.png")
//   - URL absoluta (Supabase Storage después de correr scripts/migrate-images.mjs)

export const isDataUrl = (v: unknown): v is string =>
  typeof v === "string" && v.startsWith("data:");

export type ImageSlot = 1 | 2 | 3;

/**
 * Huella corta de una foto base64. Va en la URL (&v=) para que, si se cambia la
 * foto desde el panel, el CDN no siga sirviendo la anterior.
 */
export function dataFingerprint(dataUrl: string): string {
  // Ya viene reducida por loadAll ("data:<huella>")
  if (dataUrl.length < 48) return dataUrl.slice(5);
  return dataUrl.length.toString(36) + dataUrl.slice(-12).replace(/[^a-z0-9]/gi, "");
}

export function resolveImage(
  raw: string | null | undefined,
  productId: number,
  slot: ImageSlot | `v${number}`,
): string | null {
  if (!raw) return null;
  if (isDataUrl(raw)) return `/api/img?id=${productId}&slot=${slot}&v=${dataFingerprint(raw)}`;
  return normalizePath(raw);
}

export function normalizePath(raw: string): string {
  if (/^(https?:)?\/\//.test(raw) || raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\.?\//, "")}`;
}

export const PLACEHOLDER_IMAGE = "/assets/iphone_case.png";
