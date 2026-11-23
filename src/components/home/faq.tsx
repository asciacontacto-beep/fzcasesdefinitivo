"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { FAQ_ITEMS } from "./faq-items";


export function Faq({ items = FAQ_ITEMS }: { items?: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="border-t border-line">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q} className="border-b border-line">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex min-h-16 w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium"
            >
              {it.q}
              {isOpen ? <Minus size={18} strokeWidth={1.75} className="shrink-0" /> : <Plus size={18} strokeWidth={1.75} className="shrink-0" />}
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <p className="overflow-hidden pr-10 text-ink-soft">
                <span className="block pb-6">{it.a}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
