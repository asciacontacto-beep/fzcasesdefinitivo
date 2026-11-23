import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { getProductDetail, getProducts } from "@/lib/catalog";
import { productHref } from "@/lib/format";
import { ProductView } from "@/components/product/product-view";
import { ProductGrid } from "@/components/product/product-card";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fzcases.com";

/** "123-iphone-15-pro" → 123. También acepta solo el número (links viejos). */
function idFromSlug(slug: string): number | null {
  const id = Number.parseInt(slug, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: productHref(p).split("/").pop()! }));
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const id = idFromSlug((await params).slug);
  const product = id ? await getProductDetail(id) : null;
  if (!product) return { title: "Producto no encontrado" };
  const specs = [product.storage, product.color].filter(Boolean).join(", ");
  return {
    title: `${product.name}${specs ? ` ${specs}` : ""}`,
    description: `${product.name} ${product.condition === "Usado" ? "usado" : "sellado"}${specs ? `, ${specs}` : ""}. Retiro en Tandil y Necochea.`,
    alternates: { canonical: productHref(product) },
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default function ProductPage(props: PageProps<"/producto/[slug]">) {
  return (
    <div className="container-x pb-28 pt-[104px] md:pb-0">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={props.params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const id = idFromSlug((await params).slug);
  const product = id ? await getProductDetail(id) : null;
  if (!product) notFound();

  const related = (await getProducts())
    .filter((p) => p.category === product.category && p.id !== product.id && p.stock > 0)
    .slice(0, 4);

  const url = `${SITE_URL}${productHref(product)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => (i.startsWith("http") ? i : `${SITE_URL}${i}`)),
    category: product.category,
    color: product.color || undefined,
    itemCondition: product.condition === "Usado" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
    ...(product.priceUsd > 0 && {
      offers: {
        "@type": "Offer",
        price: product.priceUsd,
        priceCurrency: "USD",
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url,
      },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Ruta" className="mb-6 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/catalogo" className="hover:text-ink">Catálogo</Link>
        <ChevronRight size={14} />
        <Link href={product.category === "Accesorios" ? "/tienda" : `/catalogo?cat=${encodeURIComponent(product.category)}`} className="hover:text-ink">
          {product.category}
        </Link>
        <ChevronRight size={14} />
        <span className="truncate text-ink-soft">{product.name}</span>
      </nav>

      <ProductView product={product} url={url} />

      {related.length > 0 && (
        <section className="pt-24" aria-labelledby="related-title">
          <div className="mb-10 flex items-end justify-between gap-6">
            <h2 id="related-title" className="text-display text-[30px] md:text-5xl">Más en {product.category}</h2>
            <Link href={product.category === "Accesorios" ? "/tienda" : `/catalogo?cat=${encodeURIComponent(product.category)}`} className="hidden text-[15px] font-medium sm:block">
              <span className="link-draw">Ver todos</span>
            </Link>
          </div>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="skeleton aspect-[4/5] rounded-[20px] lg:col-span-7" />
      <div className="space-y-4 lg:col-span-5">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-12 w-3/4 rounded" />
        <div className="skeleton h-8 w-40 rounded" />
        <div className="skeleton mt-8 h-12 w-full rounded-[10px]" />
      </div>
    </div>
  );
}
