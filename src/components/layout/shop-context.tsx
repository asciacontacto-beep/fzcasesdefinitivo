"use client";
import { createContext, useContext } from "react";
import type { ShopSettings } from "@/lib/types";

const ShopContext = createContext<ShopSettings | null>(null);

export function ShopProvider({ value, children }: { value: ShopSettings; children: React.ReactNode }) {
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopSettings {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop fuera de <ShopProvider>");
  return ctx;
}
