import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/assets/**", search: "" },
      { pathname: "/snapshot/**", search: "" },
      // Fotos que todavía están en base64 en la DB (ver src/app/api/img/route.ts)
      { pathname: "/api/img" },
    ],
    remotePatterns: [new URL("https://ffvswmjaxbvomowmigtr.supabase.co/storage/v1/object/public/**")],
  },
  // URLs del sitio viejo → rutas nuevas (links compartidos por WhatsApp, Google, etc.)
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/catalogo.html", destination: "/catalogo", permanent: true },
      { source: "/garantia.html", destination: "/garantia", permanent: true },
      { source: "/nosotros.html", destination: "/nosotros", permanent: true },
      { source: "/info-importante.html", destination: "/info-importante", permanent: true },
      { source: "/admin/dashboard.html", destination: "/admin", permanent: true },
      { source: "/admin/index.html", destination: "/admin/login", permanent: true },
    ];
  },
};

export default nextConfig;
