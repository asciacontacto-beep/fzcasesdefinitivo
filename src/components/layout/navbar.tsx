"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart, cartCount } from "@/components/cart/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/catalogo", label: "Catálogo", mega: true },
  { href: "/tienda", label: "Accesorios" },
  { href: "/canje", label: "Canje" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/preguntas-frecuentes", label: "Ayuda" },
];

export function Navbar({ categories, logoUrl }: { categories: string[]; logoUrl: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setCartOpen = useCart((s) => s.setOpen);
  const count = hydrated ? cartCount(items) : 0;

  // Al cambiar de página se cierran los menús (ajuste durante el render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const openMega = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    megaTimer.current = setTimeout(() => setMegaOpen(true), 150);
  };
  const closeMega = () => {
    if (megaTimer.current) clearTimeout(megaTimer.current);
    setMegaOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-paper" onMouseLeave={closeMega}>
        <nav className="container-x flex h-[72px] items-center justify-between gap-6" aria-label="Principal">
          <Link href="/" className="flex items-center gap-3" aria-label="FZCASES, inicio">
            <Image src={logoUrl || "/assets/logo.png"} alt="" width={40} height={40} className="h-9 w-9 rounded-full object-cover" priority />
            <span className="text-display text-[22px]">FZCASES</span>
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <li key={l.href} onMouseEnter={l.mega ? openMega : closeMega}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-2 text-[15px] font-medium text-ink-soft transition hover:text-ink",
                      active && "text-ink after:absolute after:inset-x-0 after:-bottom-[23px] after:h-0.5 after:bg-ink",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1">
            <IconButton label="Buscar" onClick={() => setSearchOpen(true)}>
              <Search size={20} strokeWidth={1.75} />
            </IconButton>
            <IconButton label={`Carrito, ${count} productos`} onClick={() => setCartOpen(true)}>
              <ShoppingBag size={20} strokeWidth={1.75} />
              {count > 0 && (
                <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[11px] font-medium text-paper">
                  {count}
                </span>
              )}
            </IconButton>
            <IconButton label={mobileOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMobileOpen((v) => !v)} className="lg:hidden" expanded={mobileOpen}>
              {mobileOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
            </IconButton>
          </div>
        </nav>

        {/* Panel de categorías: plano, con una línea, sin sombra */}
        <AnimatePresence>
          {megaOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 top-[72px] hidden border-b border-line bg-paper lg:block"
            >
              <div className="container-x grid grid-cols-12 gap-6 py-10">
                <div className="col-span-3">
                  <p className="mb-4 text-[13px] font-medium text-muted">Por estado</p>
                  <MegaLink href="/catalogo?estado=Nuevo">Sellados</MegaLink>
                  <MegaLink href="/catalogo?estado=Usado">Usados</MegaLink>
                  <MegaLink href="/catalogo">Todo el catálogo</MegaLink>
                </div>
                <div className="col-span-6">
                  <p className="mb-4 text-[13px] font-medium text-muted">Por categoría</p>
                  <div className="grid grid-cols-2 gap-x-6">
                    {categories.map((c) => (
                      <MegaLink key={c} href={c === "Accesorios" ? "/tienda" : `/catalogo?cat=${encodeURIComponent(c)}`}>{c}</MegaLink>
                    ))}
                  </div>
                </div>
                <Link href="/tienda" className="group col-span-3 overflow-hidden rounded-[20px] border border-line bg-card">
                  <div className="relative aspect-[4/3] overflow-hidden bg-alt">
                    <Image src="/assets/charger_cable.png" alt="" fill sizes="300px" className="object-contain p-6 transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <p className="px-5 py-4 text-[15px] font-medium">Accesorios con compra online</p>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MobileMenu open={mobileOpen} categories={categories} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function IconButton({
  label,
  onClick,
  children,
  className,
  expanded,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  expanded?: boolean;
}) {
  return (
    <button
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={cn("relative grid h-11 w-11 place-items-center rounded-[10px] text-ink transition hover:bg-alt", className)}
    >
      {children}
    </button>
  );
}

function MegaLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block py-1.5">
      <span className="link-draw text-display text-[26px] text-ink">{children}</span>
    </Link>
  );
}

function MobileMenu({ open, categories }: { open: boolean; categories: string[] }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 top-[72px] z-40 overflow-y-auto bg-paper lg:hidden"
        >
          <nav className="container-x py-4" aria-label="Menú">
            {[{ href: "/", label: "Inicio" }, ...LINKS].map((l) => (
              <Link key={l.href} href={l.href} className="text-display flex h-14 items-center border-b border-line text-[28px]">
                {l.label}
              </Link>
            ))}
            <p className="mb-3 mt-8 text-[13px] font-medium text-muted">Categorías</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c}
                  href={c === "Accesorios" ? "/tienda" : `/catalogo?cat=${encodeURIComponent(c)}`}
                  className="flex h-11 items-center rounded-[10px] border border-line px-4 text-[15px] font-medium"
                >
                  {c}
                </Link>
              ))}
            </div>
            <div className="mt-8 space-y-1 text-[15px] text-ink-soft">
              <Link href="/garantia" className="block py-2">Garantía</Link>
              <Link href="/info-importante" className="block py-2">Info importante</Link>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const go = (term: string) => {
    router.push(`/catalogo?q=${encodeURIComponent(term.trim())}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] bg-ink/30"
          onClick={onClose}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              go(q);
            }}
            className="border-b border-line bg-paper"
            role="search"
          >
            <div className="container-x flex h-[72px] items-center gap-3">
              <Search size={20} strokeWidth={1.75} className="text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar productos"
                placeholder="Buscar iPhone 15, funda, cargador"
                className="h-full flex-1 bg-transparent text-lg outline-none placeholder:text-faint"
              />
              <button type="button" onClick={onClose} aria-label="Cerrar búsqueda" className="grid h-11 w-11 place-items-center rounded-[10px] hover:bg-alt">
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="container-x flex flex-wrap gap-2 pb-5">
              {["iPhone 16", "iPhone 15 Pro", "AirPods", "Cargador", "MacBook Air"].map((s) => (
                <button key={s} type="button" onClick={() => go(s)} className="h-9 rounded-[8px] border border-line px-3 text-sm text-ink-soft hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
