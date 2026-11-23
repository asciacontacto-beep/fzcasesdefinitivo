import type { Metadata } from "next";
import { CanjeWizard } from "@/components/canje/canje-wizard";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Plan Canje",
  description: "Entregá tu iPhone usado como parte de pago. Completás los datos, nos los mandás por WhatsApp y te pasamos la cotización. Tandil y Necochea.",
};

const STEPS = [
  { title: "Completás los datos", text: "Modelo, estado, batería y accesorios de tu iPhone, en 7 pasos cortos." },
  { title: "Nos llega por WhatsApp", text: "Con el resumen escrito y las capturas de batería e información." },
  { title: "Te pasamos la cotización", text: "Si te sirve, hacemos el canje en Tandil o Necochea." },
];

const RULES = [
  "Batería de 85% o más",
  "Con caja y cable original",
  "Sin roturas, rayaduras ni arreglos",
  "No tomamos equipos tester",
];

export default function CanjePage() {
  return (
    <>
      <PageHeader label="Plan Canje" title="Entregá tu iPhone como parte de pago" subtitle="Cotizamos tu usado y lo descontamos del equipo que te llevás." />
      <div className="container-x grid gap-10 pt-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          <CanjeWizard />
        </div>
        <aside className="space-y-8 lg:col-span-4">
          <section>
            <h2 className="mb-4 text-[17px] font-medium">Cómo funciona</h2>
            <ol className="space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[13px] text-paper">{i + 1}</span>
                  <span>
                    <span className="block text-[15px] font-medium">{s.title}</span>
                    <span className="block text-[15px] text-ink-soft">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-[20px] bg-alt p-6">
            <h2 className="mb-3 text-[17px] font-medium">Qué equipos tomamos</h2>
            <ul className="space-y-2 text-[15px] text-ink-soft">
              {RULES.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
