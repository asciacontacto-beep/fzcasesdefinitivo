"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logEvent } from "@/lib/analytics";

/** Registra una "visita" por cada página que se abre (también en navegación interna). */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    logEvent("visita");
  }, [pathname]);
  return null;
}
