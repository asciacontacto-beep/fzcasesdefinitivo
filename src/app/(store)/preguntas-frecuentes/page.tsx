import type { Metadata } from "next";
import { Faq } from "@/components/home/faq";
import { FAQ_ITEMS } from "@/components/home/faq-items";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Cómo comprar, dónde retirar, formas de pago, garantía y plan canje en FZCASES.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader label="Ayuda" title="Preguntas frecuentes" subtitle="Si no encontrás tu respuesta, escribinos por WhatsApp." />
      <div className="container-x max-w-4xl pt-10">
        <Faq />
      </div>
    </>
  );
}
