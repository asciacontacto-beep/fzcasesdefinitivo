import type { Metadata } from "next";

// El panel es 100% del lado del cliente y se muestra recién cuando confirma la
// sesión de Supabase: no tiene sentido validarlo para navegación instantánea.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel FZCASES" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper">{children}</div>;
}
