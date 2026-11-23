import Image from "next/image";
import Link from "next/link";
import { waLink } from "@/lib/format";

function formatPhone(n: string) {
  // 5492494521518 → +54 9 2494 52-1518
  const m = /^54(9)(\d{4})(\d{2})(\d{4})$/.exec(n);
  return m ? `+54 ${m[1]} ${m[2]} ${m[3]}-${m[4]}` : `+${n}`;
}

export function Footer({ whatsapp, categories }: { whatsapp: string; categories: string[] }) {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x grid gap-10 py-16 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="" width={40} height={40} className="rounded-full" />
            <span className="text-display text-[22px]">FZCASES</span>
          </Link>
          <p className="mt-5 max-w-xs text-ink-soft">iPhone, Mac, iPad y accesorios. Sellados y usados, en Tandil y Necochea.</p>
          <a href={waLink(whatsapp, "Hola FZCASES, quería hacer una consulta.")} target="_blank" rel="noopener" className="mt-5 inline-block text-[15px] font-medium">
            <span className="link-draw">WhatsApp {formatPhone(whatsapp)}</span>
          </a>
        </div>

        <FooterCol title="Comprar" className="md:col-span-2 md:col-start-6">
          <FooterLink href="/catalogo">Catálogo</FooterLink>
          <FooterLink href="/tienda">Accesorios</FooterLink>
          {categories.filter((c) => c !== "Accesorios").slice(0, 4).map((c) => (
            <FooterLink key={c} href={`/catalogo?cat=${encodeURIComponent(c)}`}>{c}</FooterLink>
          ))}
        </FooterCol>

        <FooterCol title="FZCASES" className="md:col-span-2">
          <FooterLink href="/canje">Plan canje</FooterLink>
          <FooterLink href="/nosotros">Nosotros</FooterLink>
          <FooterLink href="/garantia">Garantía</FooterLink>
          <FooterLink href="/info-importante">Info importante</FooterLink>
          <FooterLink href="/preguntas-frecuentes">Preguntas frecuentes</FooterLink>
        </FooterCol>

        <FooterCol title="Horarios" className="md:col-span-3">
          <li className="text-ink-soft">Lunes a viernes, 9 a 18 h</li>
          <li className="text-ink-soft">Sábados, 10 a 14 h</li>
          <li className="pt-3 text-ink-soft">Tandil y Necochea, Buenos Aires</li>
          <li className="text-ink-soft">info@fzcases.com</li>
        </FooterCol>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col justify-between gap-2 py-6 text-[13px] text-muted sm:flex-row">
          <p>© 2026 FZCASES</p>
          <p>Pagos online con Mercado Pago</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-4 text-[13px] font-medium text-muted">{title}</h3>
      <ul className="space-y-2 text-[15px]">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="link-draw">{children}</Link>
    </li>
  );
}
