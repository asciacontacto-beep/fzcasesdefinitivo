import type { Metadata } from "next";
import Image from "next/image";
import { getShopSettings } from "@/lib/catalog";
import { waLink } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "FZCASES: equipos Apple sellados y usados en Tandil y Necochea, desde 2020.",
};

// Historia tal cual la publicaba el sitio anterior.
const TIMELINE = [
  { year: "2020", title: "El comienzo", text: "Arrancamos como un emprendimiento chico de fanáticos de Apple, vendiendo accesorios en marketplaces." },
  { year: "2021", title: "Presencia física", text: "Abrimos el primer punto de atención en Tandil, con retiro presencial de equipos." },
  { year: "2022", title: "Necochea", text: "Sumamos la sucursal de Necochea y pasamos los 10.000 clientes en la provincia." },
  { year: "2023", title: "Equipos Apple", text: "Pasamos de los accesorios a vender iPhone, MacBook y AirPods, nuevos y usados." },
  { year: "2024", title: "FZCASES 2.0", text: "Nueva identidad y nueva plataforma digital." },
];

export default async function NosotrosPage() {
  const { whatsapp } = await getShopSettings();
  return (
    <>
      <PageHeader
        label="Nosotros"
        title="Equipos Apple en Tandil y Necochea"
        subtitle="En FZCASES no solo vendemos productos: te asesoramos para que elijas bien y te acompañamos después de la compra."
      />
      <div className="container-x grid gap-12 pt-10 lg:grid-cols-12">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-alt lg:col-span-6">
          <Image src="/assets/local-fzcases.jpg" alt="Local de FZCASES" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <section className="lg:col-span-5 lg:col-start-8" aria-labelledby="historia">
          <h2 id="historia" className="text-display text-[30px] md:text-[40px]">Nuestra historia</h2>
          <ol className="mt-8 space-y-6 border-l border-line pl-6">
            {TIMELINE.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[29px] top-2 h-2 w-2 rounded-full bg-ink" />
                <p className="text-[13px] font-medium text-muted">{t.year}</p>
                <h3 className="text-[17px] font-medium">{t.title}</h3>
                <p className="text-ink-soft">{t.text}</p>
              </li>
            ))}
          </ol>
          <a href={waLink(whatsapp, "Hola FZCASES, quería hacer una consulta.")} target="_blank" rel="noopener" className={buttonClass("primary", "lg", "mt-10")}>
            Escribinos por WhatsApp
          </a>
        </section>
      </div>
    </>
  );
}
