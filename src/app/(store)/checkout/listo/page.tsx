import type { Metadata } from "next";
import { OrderDone } from "@/components/checkout/order-done";

export const metadata: Metadata = { title: "Pedido listo", robots: { index: false } };

export default function OrderDonePage() {
  return (
    <div className="container-x pb-16 pt-[120px]">
      <OrderDone />
    </div>
  );
}
