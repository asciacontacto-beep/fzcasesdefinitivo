import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/catalog";
import { CatalogSkeleton, CatalogView } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Accesorios",
  description: "Cargadores, adaptadores, cables y EarPods. Comprá online con Mercado Pago y retiralo en Tandil o Necochea, o recibilo en tu casa.",
};

const FACTS = [
  { title: "Mercado Pago", text: "Crédito, débito o dinero en cuenta" },
  { title: "O por WhatsApp", text: "Transferencia o efectivo al retirar" },
  { title: "Retiro sin costo", text: "En Tandil o Necochea" },
  { title: "Envío a domicilio", text: "El costo se coordina por WhatsApp" },
];

export default async function ShopPage() {
  const products = (await getProducts()).filter((p) => p.category === "Accesorios");
  return (
    <>
      <PageHeader
        label="Tienda online"
        title="Accesorios Apple con compra online"
        subtitle="Los agregás al carrito, pagás y elegís si lo retirás o te lo enviamos."
      />
      <div className="container-x pt-10">
        <ul className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-4">
          {FACTS.map((f) => (
            <li key={f.title} className="bg-card p-5">
              <p className="text-[15px] font-medium">{f.title}</p>
              <p className="text-sm text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogView products={products} categories={[]} lockedCategory="Accesorios" />
        </Suspense>
      </div>
    </>
  );
}
