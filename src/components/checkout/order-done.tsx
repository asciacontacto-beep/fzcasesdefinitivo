"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/layout/whatsapp-fab";
import { buttonClass } from "@/components/ui/button";
import { formatArs } from "@/lib/format";
import type { BankAccount } from "@/lib/types";
import { ORDER_STORAGE_KEY } from "./checkout-form";

interface Result {
  numero: number | null;
  totals: { totalArs: number; discountArs: number };
  method: "transferencia" | "efectivo";
  waUrl: string;
  bank: BankAccount | null;
  discountPct: number;
}

const subscribe = () => () => {};
const read = () => {
  try {
    return sessionStorage.getItem(ORDER_STORAGE_KEY);
  } catch {
    return null;
  }
};

export function OrderDone() {
  const raw = useSyncExternalStore(subscribe, read, () => undefined);
  if (raw === undefined) return <div className="skeleton h-80 rounded-[20px]" />;
  if (!raw) {
    return (
      <div className="py-10 text-center">
        <p className="text-[20px] font-medium">No encontramos un pedido reciente</p>
        <Link href="/tienda" className={buttonClass("primary", "md", "mt-6")}>Ir a la tienda</Link>
      </div>
    );
  }
  const order = JSON.parse(raw) as Result;
  const bank = order.bank;
  const hasBank = !!bank && !!(bank.cbu || bank.alias);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[13px] font-medium text-muted">{order.numero ? `Pedido #${order.numero}` : "Tu pedido"}</p>
      <h1 className="text-display mt-2 text-[34px] md:text-[48px]">Último paso: mandanos el pedido por WhatsApp</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Ya está escrito, solo tenés que enviarlo. Con ese mensaje confirmamos el stock y coordinamos la entrega.
      </p>
      <a href={order.waUrl} target="_blank" rel="noopener" className={buttonClass("whatsapp", "lg", "mt-8 w-full sm:w-auto")}>
        <WhatsAppIcon size={20} /> Enviar el pedido por WhatsApp
      </a>

      {order.method === "transferencia" && (
        <section className="mt-12 rounded-[20px] border border-line bg-card">
          <header className="border-b border-line px-6 py-4">
            <h2 className="text-[17px] font-medium">Datos para la transferencia</h2>
            <p className="text-[15px] text-ink-soft">
              Total a transferir: <strong className="text-ink">{formatArs(order.totals.totalArs)}</strong>
              {order.totals.discountArs > 0 && ` (ya tiene el ${order.discountPct}% off)`}
            </p>
          </header>
          {hasBank ? (
            <dl className="divide-y divide-line">
              <CopyRow label="Alias" value={bank!.alias} />
              <CopyRow label="CBU / CVU" value={bank!.cbu} />
              <CopyRow label="Titular" value={bank!.titular} />
              <CopyRow label="CUIL" value={bank!.cuil} />
              <CopyRow label="Banco" value={bank!.banco} copy={false} />
              <CopyRow label="Cuenta" value={bank!.cuenta} copy={false} />
            </dl>
          ) : (
            <p className="px-6 py-5 text-[15px] text-ink-soft">Te pasamos los datos de la cuenta por WhatsApp.</p>
          )}
          <p className="border-t border-line px-6 py-4 text-[13px] text-muted">Mandanos el comprobante por el mismo chat así lo confirmamos.</p>
        </section>
      )}

      <Link href="/tienda" className="mt-10 inline-block text-[15px] font-medium">
        <span className="link-draw">Seguir mirando la tienda</span>
      </Link>
    </div>
  );
}

function CopyRow({ label, value, copy = true }: { label: string; value: string; copy?: boolean }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <div className="min-w-0">
        <dt className="text-[13px] text-muted">{label}</dt>
        <dd className="truncate text-[15px] font-medium tabular-nums">{value}</dd>
      </div>
      {copy && (
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value).catch(() => toast.error("No se pudo copiar"));
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
          aria-label={`Copiar ${label}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-line hover:border-ink"
        >
          {done ? <Check size={16} /> : <Copy size={16} />}
        </button>
      )}
    </div>
  );
}
