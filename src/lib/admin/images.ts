"use client";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** Achica una foto en el navegador antes de subirla (lado mayor `maxSide`, JPEG). */
export async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  // PNG con transparencia: se conserva como PNG para no perder el recorte
  const keepPng = file.type === "image/png";
  if (!keepPng) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen"))), keepPng ? "image/png" : "image/jpeg", quality),
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Sube una foto al bucket "media" de Supabase Storage y devuelve su URL pública.
 * Si el bucket todavía no existe (migración 001 sin correr), cae al formato
 * viejo: la guarda como base64 más chica, igual que el panel anterior.
 */
export async function uploadImage(file: File, folder: string): Promise<{ url: string; storage: boolean }> {
  const blob = await compressImage(file);
  const ext = blob.type === "image/png" ? "png" : "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const sb = supabaseBrowser();
  const { error } = await sb.storage.from("media").upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
  if (!error) {
    return { url: sb.storage.from("media").getPublicUrl(path).data.publicUrl, storage: true };
  }
  console.warn("[uploadImage] Storage no disponible, guardo en base64:", error.message);
  const small = await compressImage(file, 1100, 0.78);
  return { url: await blobToDataUrl(small), storage: false };
}
