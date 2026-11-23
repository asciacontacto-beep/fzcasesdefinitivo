"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/format";
import { PLACEHOLDER_IMAGE } from "@/lib/images";

/**
 * Foto grande + miniaturas. `activeImage` lo controla el selector de variantes:
 * al elegir otra variante con foto propia, la foto grande pasa a esa.
 */
export function ProductGallery({
  images,
  name,
  activeImage,
  onSelect,
}: {
  images: string[];
  name: string;
  activeImage: string | null;
  onSelect: (src: string) => void;
}) {
  const list = images.length ? images : [PLACEHOLDER_IMAGE];
  const current = activeImage && list.includes(activeImage) ? activeImage : list[0];
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4">
      <div
        className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden rounded-[20px] bg-alt"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {list.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? name : `${name}, foto ${i + 1}`}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            quality={90}
            className={cn(
              "object-cover transition-[opacity,transform] duration-300 ease-out",
              src === current ? "opacity-100" : "opacity-0",
            )}
            style={
              src === current && zoom
                ? { transform: "scale(1.6)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : undefined
            }
          />
        ))}
      </div>

      {list.length > 1 && (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible">
          {list.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                onClick={() => onSelect(src)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={src === current}
                className={cn(
                  "relative block h-20 w-20 overflow-hidden rounded-[12px] border bg-alt transition",
                  src === current ? "border-ink" : "border-line hover:border-ink/40",
                )}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
