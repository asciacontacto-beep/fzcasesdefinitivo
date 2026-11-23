"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

/** Piezas chicas compartidas por todas las pantallas del panel. */

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-display text-[32px] md:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children, title, action }: { className?: string; children: React.ReactNode; title?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-[20px] border border-line bg-card", className)}>
      {title && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-[17px] font-medium">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[15px] font-medium">{label}</p>
        {hint && <p className="text-[13px] text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-ink" : "bg-line")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-[10px] border border-line bg-card p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn("h-9 rounded-[8px] px-3.5 text-sm font-medium transition", value === o.value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const TONES = {
  neutral: "bg-alt text-ink-soft",
  success: "bg-[#e6f0e8] text-success",
  warning: "bg-[#f6ecd9] text-warning",
  danger: "bg-[#f5e2df] text-danger",
  ink: "bg-ink text-paper",
};

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium", TONES[tone])}>{children}</span>;
}

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn("max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] bg-card sm:rounded-[20px]", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-6 py-4">
          <h2 className="text-[17px] font-medium">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-[8px] hover:bg-alt">
            <X size={18} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-[17px] font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "warning", children }: { tone?: "warning" | "neutral"; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[12px] px-4 py-3 text-[15px]", tone === "warning" ? "bg-[#f6ecd9] text-[#5c3d0c]" : "bg-alt text-ink-soft")}>
      {children}
    </div>
  );
}
