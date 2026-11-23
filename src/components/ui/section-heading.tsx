import { cn } from "@/lib/format";

/** Título de sección: una etiqueta chica, el h2 en serif y, opcional, una acción a la derecha. */
export function SectionHeading({
  label,
  title,
  subtitle,
  dark = false,
  action,
}: {
  label?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  dark?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {label && <p className={cn("mb-3 text-[13px] font-medium", dark ? "text-white/60" : "text-muted")}>{label}</p>}
        <h2 className={cn("text-display text-[30px] md:text-5xl", dark ? "text-paper" : "text-ink")}>{title}</h2>
        {subtitle && <p className={cn("mt-4 max-w-xl text-lg", dark ? "text-white/70" : "text-ink-soft")}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
