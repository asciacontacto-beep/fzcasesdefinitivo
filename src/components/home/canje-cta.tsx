import Image from "next/image";
import { LinkButton } from "@/components/ui/button";

export function CanjeCta({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="container-x pt-24" aria-labelledby="canje-title">
      <div className="grid items-center gap-10 overflow-hidden rounded-[20px] bg-alt md:grid-cols-12 md:gap-6">
        <div className="p-8 md:col-span-6 md:p-14">
          <p className="mb-4 text-[13px] font-medium text-muted">Plan canje</p>
          <h2 id="canje-title" className="text-display text-[30px] md:text-5xl">{title}</h2>
          <p className="mt-5 max-w-md text-lg text-ink-soft">{subtitle}</p>
          <ol className="mt-8 space-y-3 text-ink-soft">
            <li><span className="mr-3 font-medium text-ink">1</span>Completás los datos de tu iPhone en 7 pasos.</li>
            <li><span className="mr-3 font-medium text-ink">2</span>Nos llegan por WhatsApp con las capturas de batería.</li>
            <li><span className="mr-3 font-medium text-ink">3</span>Te pasamos la cotización y coordinamos el canje.</li>
          </ol>
          <LinkButton href="/canje" size="lg" className="mt-9">Cotizar mi iPhone</LinkButton>
        </div>
        <div className="relative aspect-square md:col-span-6">
          <Image src="/assets/canje_exchange.png" alt="Dos iPhone, el usado y el nuevo" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-8" />
        </div>
      </div>
    </section>
  );
}
