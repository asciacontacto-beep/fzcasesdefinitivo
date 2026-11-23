import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap", weight: ["400", "500", "600"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fzcases.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FZCASES | iPhone & Equipos Apple Premium",
    template: "%s | FZCASES",
  },
  description:
    "Venta de iPhones y equipos Apple premium. Stock real, equipos originales con garantía, plan canje y accesorios con envío. Tandil y Necochea.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "FZCASES",
    images: ["/assets/hero-fz.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={hanken.variable}>
      <body>
        {children}
        <Toaster position="top-center" toastOptions={{ style: { borderRadius: 12, fontFamily: "var(--font-sans)" } }} />
      </body>
    </html>
  );
}
