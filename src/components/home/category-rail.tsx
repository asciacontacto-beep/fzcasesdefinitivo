/* eslint-disable @next/next/no-img-element -- las imágenes de categorías son URLs libres cargadas desde el panel */
import Link from "next/link";
import type { CategoryNavItem } from "@/lib/types";

// Recortes de producto por defecto (los mismos del sitio anterior) para las
// categorías que no tengan imagen cargada desde el panel.
const DEFAULT_IMAGES: Record<string, string> = {
  iPad: "https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_pro_bd732ab83_2x.png",
  MacBook: "https://www.apple.com/assets-www/en_WW/mac/04_chapternav/small/nav_mbp_0b36bc863_2x.png",
  "Apple Watch": "/assets/nav_watch_real.png",
  AirPods: "/assets/airpods_case.png",
  Accesorios: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=200&hei=200&fmt=png-alpha",
};

/** La tira de categorías con los recortes de cada producto, debajo del hero. */
export function CategoryRail({ items, categories }: { items: CategoryNavItem[]; categories: string[] }) {
  const list = items.length
    ? items.filter((i) => i.active)
    : categories.map((c) => ({ name: c, url: "", imgUrl: "", active: true }));

  return (
    <nav aria-label="Categorías" className="border-y border-line bg-card">
      <ul className="no-scrollbar container-x flex gap-2 overflow-x-auto py-8 md:justify-center md:gap-10">
        {list.map((item) => {
          const img = item.imgUrl || DEFAULT_IMAGES[item.name];
          const href = item.name === "Accesorios" ? "/tienda" : `/catalogo?cat=${encodeURIComponent(item.name)}`;
          return (
            <li key={item.name} className="shrink-0">
              <Link href={href} className="group flex w-[88px] flex-col items-center gap-3 text-center md:w-[104px]">
                {/* Caja fija igual para todas: la imagen se ajusta adentro sin desbordar.
                    multiply hace invisible cualquier fondo blanco que traiga una imagen cargada desde el panel. */}
                <span className="relative grid h-[72px] w-[88px] place-items-center md:h-[84px] md:w-[104px]">
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain mix-blend-multiply transition duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="text-display text-3xl text-faint">{item.name[0]}</span>
                  )}
                </span>
                <span className="text-[14px] font-medium text-ink-soft transition group-hover:text-ink">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
