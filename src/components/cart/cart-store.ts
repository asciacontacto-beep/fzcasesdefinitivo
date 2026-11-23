"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: number;
  name: string;
  image: string | null;
  color: string;
  priceUsd: number;
  qty: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          const max = Math.max(item.maxStock, 1);
          if (existing) {
            return {
              open: true,
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, ...item, qty: Math.min(i.qty + qty, max) } : i,
              ),
            };
          }
          return { open: true, items: [...s.items, { ...item, qty: Math.min(qty, max) }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, qty: Math.min(Math.max(qty, 0), Math.max(i.maxStock, 1)) } : i))
            .filter((i) => i.qty > 0),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "fz-cart",
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
export const cartSubtotalUsd = (items: CartItem[]) => items.reduce((n, i) => n + i.qty * i.priceUsd, 0);
