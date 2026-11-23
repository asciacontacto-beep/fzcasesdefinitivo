import Image from "next/image";
import { LinkButton } from "@/components/ui/button";

/** La banda oscura de la página: empuja a la tienda online de accesorios. */
export function ShopPromo({ count }: { count: number }) {
  return (
    <section className="mt-24 bg-night text-paper">
      <div className="container-x grid items-center gap-10 py-20 md:grid-cols-12 md:gap-6 md:py-28">
        <div className="md:col-span-5">
          <p className="mb-4 text-[13px] font-medium text-white/60">Tienda online</p>
          <h2 className="text-display text-[30px] md:text-5xl">Accesorios que comprás online, con retiro o envío</h2>
          <p className="mt-5 max-w-md text-lg text-white/75">
            Cargadores MagSafe, adaptadores USB‑C, cables y EarPods. Pagás con Mercado Pago o coordinás por WhatsApp, y lo retirás en Tandil o Necochea o te lo enviamos.
          </p>
          <LinkButton href="/tienda" size="lg" variant="inverse" className="mt-9">
            Ver los {count} accesorios
          </LinkButton>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-alt md:col-span-6 md:col-start-7">
          <Image src="/assets/charger_cable.png" alt="Cargador y cable USB-C" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-10" />
        </div>
      </div>
    </section>
  );
}
