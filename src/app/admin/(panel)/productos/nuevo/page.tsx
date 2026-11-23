import { ProductEditor } from "@/components/admin/product-editor";

export const metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
  return <ProductEditor id={null} />;
}
