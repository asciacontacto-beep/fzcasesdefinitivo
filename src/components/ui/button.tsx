import Link from "next/link";
import { cn } from "@/lib/format";

// Un solo sistema: un botón lleno (la acción principal) y uno secundario con borde.
// Sube 1px al pasar el mouse y se hunde al hacer click. Sin sombras ni degradés.
type Variant = "primary" | "secondary" | "inverse" | "whatsapp";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-black",
  secondary: "border border-ink/20 text-ink hover:border-ink bg-transparent",
  inverse: "bg-paper text-ink hover:bg-white",
  whatsapp: "bg-[#1f7a4a] text-white hover:bg-[#1a6a40]",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[15px]",
  lg: "h-12 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
