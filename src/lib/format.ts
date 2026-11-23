export function formatUsd(n: number): string {
  return `US$ ${Math.round(n).toLocaleString("es-AR")}`;
}

export function formatArs(n: number): string {
  return `$ ${Math.round(n).toLocaleString("es-AR")}`;
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productHref(p: { id: number; name: string }): string {
  return `/producto/${p.id}-${slugify(p.name)}`;
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
