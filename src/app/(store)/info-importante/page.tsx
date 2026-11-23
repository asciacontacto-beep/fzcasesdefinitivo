import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Info importante",
  description: "Equipos y accesorios originales, usados de clientes sin arreglos ni roturas, entregados en caja y con cable original.",
};

const FACTS = [
  { title: "Solo originales", text: "Vas a encontrar únicamente equipos y accesorios originales. No vendemos réplicas." },
  { title: "Usados de clientes", text: "Todos los usados son de clientes, no los compramos en otro lugar, y ninguno tiene arreglos, roturas ni rayaduras." },
  { title: "En caja y con cable original", text: "Cada equipo se entrega en su caja y con su cable original." },
  { title: "Asesoramiento", text: "Te asesoramos según lo que necesitás, antes y después de la compra." },
];

export default function InfoImportantePage() {
  return (
    <>
      <PageHeader label="Info importante" title="Lo que tenés que saber antes de comprar" subtitle="Cómo elegimos los equipos que vendemos y en qué condiciones te los entregamos." />
      <div className="container-x pt-10">
        <ul className="grid gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-2">
          {FACTS.map((f) => (
            <li key={f.title} className="bg-card p-8">
              <h2 className="text-[20px] font-medium">{f.title}</h2>
              <p className="mt-2 text-ink-soft">{f.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <LinkButton href="/garantia" variant="secondary">Leer la garantía</LinkButton>
          <LinkButton href="/catalogo">Ver el catálogo</LinkButton>
        </div>
      </div>
    </>
  );
}
