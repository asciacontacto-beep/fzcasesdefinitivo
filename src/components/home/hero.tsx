import Image from "next/image";
import { LinkButton } from "@/components/ui/button";

/**
 * Hero partido: texto sobre el fondo liso a la izquierda, la foto grande a la
 * derecha (sin velo ni degradé encima). Entra una sola vez al cargar.
 * Usa la primera foto de portada que se cargue desde el panel.
 */
export function Hero({ title, subtitle, image }: { title: string; subtitle: string; image: string }) {
  return (
    <section className="pt-[72px]">
      <div className="container-x grid min-h-[calc(100svh-72px)] items-center gap-10 py-10 md:grid-cols-12 md:gap-6 md:py-12">
        <div className="hero-enter md:col-span-6 lg:col-span-5">
          <p className="mb-6 text-[13px] font-medium text-muted">Sellados y usados · Retiro en Tandil y Necochea</p>
          <h1 className="text-display text-[40px] sm:text-[56px] lg:text-[72px]">{title}</h1>
          <p className="mt-6 max-w-md text-lg text-ink-soft">{subtitle}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/catalogo" size="lg">Ver el catálogo</LinkButton>
            <LinkButton href="/canje" size="lg" variant="secondary">Cotizar mi iPhone</LinkButton>
          </div>
        </div>
        <div className="hero-enter hero-enter-late relative aspect-[4/5] overflow-hidden rounded-[20px] bg-alt md:col-span-6 md:col-start-7 lg:col-span-7 lg:col-start-6 lg:aspect-auto lg:h-[calc(100svh-72px-6rem)]">
          <Image src={image} alt="Equipos Apple sellados en FZCASES" fill priority sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
