"use client";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export const FAQ_ITEMS = [
  {
    q: "¿Cómo compro un accesorio?",
    a: "Lo agregás al carrito desde la tienda y en el checkout elegís pagar con Mercado Pago o coordinar el pago por WhatsApp.",
  },
  {
    q: "¿Cómo compro un iPhone, una Mac o un iPad?",
    a: "Desde la ficha de cada equipo nos escribís por WhatsApp. Te confirmamos precio y stock y coordinamos el retiro.",
  },
  {
    q: "¿Dónde retiro mi pedido?",
    a: "En Tandil o en Necochea. Al confirmar el pedido coordinamos día, horario y punto de entrega. Los accesorios también se envían a domicilio.",
  },
  {
    q: "¿Tienen local?",
    a: "Trabajamos con punto de entrega. Cuando confirmás tu pedido te pasamos la dirección y el horario.",
  },
  {
    q: "¿Puedo ver los equipos antes de comprar?",
    a: "Sí. Coordinás una cita por WhatsApp y los ves en persona.",
  },
  {
    q: "¿Qué garantía tienen?",
    a: "Los equipos sellados tienen la garantía oficial de Apple por 12 meses. Antes de retirarte podés abrir y probar tu compra; después, los reclamos se hacen con Apple o un servicio autorizado.",
  },
  {
    q: "¿Cómo puedo pagar?",
    a: "Online: Mercado Pago (crédito, débito o dinero en cuenta). Por WhatsApp: transferencia o efectivo al retirar.",
  },
  {
    q: "¿Los accesorios son originales?",
    a: "Los equipos son siempre Apple originales. En algunos accesorios (fundas, cables) también tenemos alternativas de otras marcas, y lo indicamos en la descripción de cada uno.",
  },
  {
    q: "¿Cómo funciona el plan canje?",
    a: "Completás el formulario con los datos de tu iPhone usado, lo enviás por WhatsApp y te respondemos con una cotización. Si te sirve, hacemos el canje en Tandil o Necochea.",
  },
];

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
