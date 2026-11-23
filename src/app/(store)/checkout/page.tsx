import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-x pb-16 pt-[112px]">
      <h1 className="text-display mb-10 text-[34px] md:text-[48px]">Finalizar compra</h1>
      <CheckoutForm />
    </div>
  );
}
