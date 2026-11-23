"use client";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./cart-store";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";

export function AddToCartButton({
  product,
  qty = 1,
  compact = false,
  className,
}: {
  product: Pick<Product, "id" | "name" | "image" | "color" | "priceUsd" | "stock">;
  qty?: number;
  compact?: boolean;
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const onClick = () => {
    add(
      { id: product.id, name: product.name, image: product.image, color: product.color, priceUsd: product.priceUsd, maxStock: product.stock },
      qty,
    );
    toast(`${product.name} está en tu carrito`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        aria-label={`Agregar ${product.name} al carrito`}
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-ink/20 text-ink transition hover:-translate-y-px hover:border-ink active:scale-95",
          added && "border-ink bg-ink text-paper",
          className,
        )}
      >
        {added ? <Check size={18} strokeWidth={1.75} /> : <Plus size={18} strokeWidth={1.75} />}
      </button>
    );
  }

  return (
    <button onClick={onClick} className={buttonClass("primary", "lg", cn("w-full", className))}>
      {added ? <Check size={18} strokeWidth={1.75} /> : null}
      {added ? "Agregado al carrito" : "Agregar al carrito"}
    </button>
  );
}
