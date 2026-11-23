"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ExternalLink, LayoutGrid, LogOut, Menu, Package, Receipt, Settings, ShoppingBag, X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/format";

const SessionContext = createContext<Session | null>(null);
export const useSession = () => useContext(SessionContext);

const NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutGrid, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/ventas", label: "Ventas", icon: Receipt },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) router.replace("/admin/login");
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) router.replace("/admin/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        {session === undefined ? "Cargando…" : "Redirigiendo al ingreso…"}
      </div>
    );
  }

  const logout = async () => {
    await supabaseBrowser().auth.signOut();
    router.replace("/admin/login");
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Panel">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition",
              active ? "bg-ink text-paper" : "text-ink-soft hover:bg-alt hover:text-ink",
            )}
          >
            <n.icon size={18} strokeWidth={1.75} /> {n.label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 border-t border-line pt-4">
        <a href="/" target="_blank" rel="noopener" className="flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] text-ink-soft hover:bg-alt">
          <ExternalLink size={18} strokeWidth={1.75} /> Ver la tienda
        </a>
        <button onClick={logout} className="flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[15px] text-ink-soft hover:bg-alt">
          <LogOut size={18} strokeWidth={1.75} /> Salir
        </button>
        <p className="truncate px-3 pt-2 text-[13px] text-muted">{session.user.email}</p>
      </div>
    </nav>
  );

  return (
    <SessionContext.Provider value={session}>
      <div className="lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col gap-8 border-r border-line bg-card p-5 lg:flex">
          <Link href="/admin" className="flex items-center gap-3 px-2">
            <Image src="/assets/logo.png" alt="" width={32} height={32} className="rounded-full" />
            <span className="text-display text-[19px]">FZCASES</span>
          </Link>
          {nav}
        </aside>

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/assets/logo.png" alt="" width={30} height={30} className="rounded-full" />
            <span className="text-display text-[18px]">Panel</span>
          </Link>
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="Menú" aria-expanded={menuOpen} className="grid h-11 w-11 place-items-center rounded-[10px] hover:bg-alt">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
        {menuOpen && <div className="fixed inset-0 top-16 z-20 flex flex-col bg-paper p-4 lg:hidden">{nav}</div>}

        <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </SessionContext.Provider>
  );
}
