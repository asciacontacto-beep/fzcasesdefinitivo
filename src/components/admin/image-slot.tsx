"use client";
/* eslint-disable @next/next/no-img-element -- previsualización de fotos locales/base64/Storage */
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/admin/images";
import { normalizePath } from "@/lib/images";
import { cn } from "@/lib/format";

/** Recuadro para subir, ver y quitar una foto. Sube al elegir el archivo. */
export function ImageSlot({
  value,
  onChange,
  folder,
  label,
  className,
  compact = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const src = value ? (value.startsWith("data:") ? value : normalizePath(value)) : null;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("El archivo no es una imagen.");
    setBusy(true);
    try {
      const { url, storage } = await uploadImage(file, folder);
      onChange(url);
      if (!storage) toast("Foto guardada en formato viejo: falta correr la migración para usar Storage.");
    } catch (e) {
      toast.error(`No se pudo subir la foto: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={cn("group relative", className)}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void pick(e.dataTransfer.files[0]);
        }}
        aria-label={label ? `Subir ${label}` : "Subir foto"}
        className={cn(
          "relative grid w-full place-items-center overflow-hidden rounded-[12px] border border-dashed border-ink/20 bg-alt transition hover:border-ink",
          compact ? "h-12 w-12" : "aspect-square",
          src && "border-solid border-line",
        )}
      >
        {src ? (
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[13px] text-muted">
            <ImagePlus size={compact ? 16 : 22} strokeWidth={1.5} />
            {!compact && (label ?? "Subir foto")}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 size={20} className="animate-spin" />
          </span>
        )}
      </button>
      {src && !busy && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Quitar foto"
          className={cn(
            "absolute grid place-items-center rounded-full bg-white text-ink shadow-sm transition hover:text-danger",
            compact ? "-right-1.5 -top-1.5 h-5 w-5" : "right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100",
          )}
        >
          <Trash2 size={compact ? 11 : 15} />
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}
