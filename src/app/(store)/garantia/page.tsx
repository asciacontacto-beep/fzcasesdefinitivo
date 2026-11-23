import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Garantía",
  description: "La garantía de los equipos es la oficial de Apple por 12 meses. Qué cubre, cómo se reclama y nuestra política de cambios.",
};

// Textos tal cual los publicaba el sitio anterior.
const TERMS = [
  { title: "Garantía oficial de Apple por 12 meses", text: "La garantía siempre fue, es y será la oficial de Apple por 12 meses. Sin excepción." },
  { title: "No hay garantía propia ni días de prueba", text: "No ofrecemos una garantía propia de FZCASES ni días de prueba." },
  { title: "Revisás tu compra antes de irte", text: "Podés verificar, abrir y probar tu compra antes de retirarte. Si no lo hacés, es tu responsabilidad." },
  { title: "Los reclamos se hacen con Apple", text: "Después de la compra, cualquier reclamo se gestiona directamente con Apple o con sus servicios de reparación autorizados." },
  { title: "Sin cambios ni devoluciones", text: "Una vez retirado el producto no hacemos cambios ni devoluciones por ningún motivo. Esto incluye fallas de fábrica, arrepentimiento de modelo o color y compatibilidad de eSIM o SIM." },
];

export default function GarantiaPage() {
  return (
    <>
      <PageHeader label="Garantía" title="Garantía y política de compra" subtitle="Lo que cubre tu compra y cómo se reclama, por escrito." />
      <div className="container-x pt-10">
        <ol className="max-w-3xl divide-y divide-line border-y border-line">
          {TERMS.map((t, i) => (
            <li key={t.title} className="grid gap-2 py-7 sm:grid-cols-[48px_1fr]">
              <span className="text-[15px] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-[20px] font-medium">{t.title}</h2>
                <p className="mt-1 text-ink-soft">{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-3xl text-ink-soft">
          ¿Dudas antes de comprar? Mirá las{" "}
          <Link href="/preguntas-frecuentes" className="font-medium text-ink"><span className="link-draw">preguntas frecuentes</span></Link>{" "}
          o escribinos por WhatsApp.
        </p>
      </div>
    </>
  );
}
