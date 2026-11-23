import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn, formatUsd, productHref } from "@/lib/format";
import { PLACEHOLDER_IMAGE } from "@/lib/images";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const href = productHref(product);
  const soldOut = product.stock <= 0;
  const specs = [product.storage, product.color].filter(Boolean).join(" · ");
  const tag = soldOut
    ? "Sin stock"
    : product.condition === "Usado"
      ? product.battery
        ? `Usado · batería ${product.battery}%`
        : "Usado"
      : product.category === "Accesorios"
        ? "Nuevo"
        : "Sellado";

  return (
    <article className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-card transition duration-300 ease-out hover:-translate-y-0.5 hover:border-ink/25">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-alt" aria-label={product.name}>
        <Image
          src={product.image || PLACEHOLDER_IMAGE}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
          className={cn("object-cover transition duration-500 ease-out group-hover:scale-[1.03]", soldOut && "opacity-50 grayscale")}
        />
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[13px] font-medium text-muted">{tag}</p>
        <Link href={href} className="mt-1 text-[17px] font-medium leading-snug text-ink sm:text-lg">
          {product.name}
        </Link>
        {specs && <p className="mt-0.5 text-sm text-muted">{specs}</p>}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          {product.priceUsd > 0 ? (
            <p className="text-lg font-medium">{formatUsd(product.priceUsd)}</p>
          ) : (
            <p className="text-sm text-muted">Precio por WhatsApp</p>
          )}
          {product.sellOnline && !soldOut && <AddToCartButton product={product} compact />}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
