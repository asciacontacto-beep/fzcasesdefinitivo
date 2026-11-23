import { Suspense } from "react";
import { ProductEditor } from "@/components/admin/product-editor";

export const metadata = { title: "Editar producto" };

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-[20px]" />}>
      {params.then(({ id }) => (
        <ProductEditor key={id} id={Number(id) || -1} />
      ))}
    </Suspense>
  );
}
