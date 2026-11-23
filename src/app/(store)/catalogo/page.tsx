import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getProducts } from "@/lib/catalog";
import { CatalogSkeleton, CatalogView } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "iPhone, iPad, MacBook, Apple Watch, AirPods y accesorios. Sellados y usados seleccionados con stock real.",
};

export default async function CatalogPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <>
      <PageHeader label="Catálogo" title="Equipos Apple sellados y usados" subtitle="Todo lo publicado está en stock para retirar en Tandil o Necochea." />
      <div className="container-x pt-10">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogView products={products} categories={categories} />
        </Suspense>
      </div>
    </>
  );
}
