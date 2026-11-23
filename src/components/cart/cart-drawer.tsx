"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useCart, cartSubtotalUsd, cartCount } from "./cart-store";
import { useShop } from "@/components/layout/shop-context";
import { buttonClass } from "@/components/ui/button";
import { formatArs, formatUsd } from "@/lib/format";
import { PLACEHOLDER_IMAGE } from "@/lib/images";
import { transferPrice } from "@/lib/shop-defaults";
import { useHydrated } from "@/lib/use-hydrated";

export function CartDrawer() {
  const { open, setOpen, items, setQty, remove } = useCart();
  const { usdRate, transferEnabled, transferDiscountPct } = useShop();
  const hydrated = useHydrated();
  const subtotal = cartSubtotalUsd(items);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && hydrated && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/40 "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Carrito"
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col bg-card"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-display text-xl">
                Tu carrito <span className="text-faint">({cartCount(items)})</span>
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-[10px] p-2 hover:bg-alt">
                <X size={20} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-alt">
                  <ShoppingBag size={32} className="text-faint" />
                </div>
                <p className="text-display text-2xl">Tu carrito está vacío</p>
                <p className="text-muted">Fundas, cargadores, cables y más, listos para comprar online.</p>
                <Link href="/tienda" onClick={() => setOpen(false)} className={buttonClass("primary", "md", "mt-2")}>
                  Ir a la tienda
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        exit={{ opacity: 0, x: 40 }}
                        className="flex gap-4 py-5"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[12px] bg-alt">
                          <Image src={item.image || PLACEHOLDER_IMAGE} alt={item.name} fill sizes="80px" className="object-contain p-2" />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <div>
                              <p className="font-medium leading-tight">{item.name}</p>
                              {item.color && <p className="mt-0.5 text-sm text-muted">{item.color}</p>}
                            </div>
                            <button onClick={() => remove(item.id)} aria-label="Quitar" className="h-fit rounded-[10px] p-1.5 text-faint hover:bg-alt hover:text-danger">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <QtyStepper qty={item.qty} max={item.maxStock} onChange={(q) => setQty(item.id, q)} />
                            <p className="font-medium">{formatUsd(item.priceUsd * item.qty)}</p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="space-y-4 border-t border-line bg-paper px-6 py-5">
                  <div className="flex items-center gap-2 rounded-xl bg-alt px-3 py-2 text-sm text-ink">
                    <Truck size={16} /> Retiro gratis en Tandil o Necochea · Envíos a todo el país
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-muted">Subtotal</span>
                    <div className="text-right">
                      <p className="text-display text-2xl">{formatUsd(subtotal)}</p>
                      <p className="text-sm text-muted">{formatArs(subtotal * usdRate)}</p>
                      {transferEnabled && transferDiscountPct > 0 && (
                        <p className="text-sm font-medium">{formatArs(transferPrice(subtotal * usdRate, transferDiscountPct))} por transferencia</p>
                      )}
                    </div>
                  </div>
                  <Link href="/checkout" onClick={() => setOpen(false)} className={buttonClass("primary", "lg", "w-full")}>
                    Finalizar compra
                  </Link>
                  <button onClick={() => setOpen(false)} className="w-full text-center text-sm font-medium text-muted hover:text-ink">
                    Seguir comprando
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function QtyStepper({ qty, max, onChange }: { qty: number; max: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center rounded-[10px] border border-line">
      <button onClick={() => onChange(qty - 1)} aria-label="Restar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-alt">
        <Minus size={14} />
      </button>
      <span className="w-7 text-center text-sm font-medium tabular-nums">{qty}</span>
      <button
        onClick={() => onChange(qty + 1)}
        disabled={qty >= max}
        aria-label="Sumar"
        className="grid h-8 w-8 place-items-center rounded-full hover:bg-alt disabled:opacity-30"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
