import { getCategories, getProducts, getSiteSettings } from "@/lib/catalog";
import { Hero } from "@/components/home/hero";
import { CategoryRail } from "@/components/home/category-rail";
import { ShopPromo } from "@/components/home/shop-promo";
import { HowWeWork } from "@/components/home/how-we-work";
import { CanjeCta } from "@/components/home/canje-cta";
import { Testimonials } from "@/components/home/testimonials";
import { Faq } from "@/components/home/faq";
import { ProductGrid } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/button";

export default async function HomePage() {
  const [site, products, categories] = await Promise.all([getSiteSettings(), getProducts(), getCategories()]);

  const inStock = products.filter((p) => p.stock > 0);
  const featured = inStock.filter((p) => p.featured).slice(0, 4);
  let fresh = inStock.filter((p) => p.isNew && !p.featured).slice(0, 8);
  if (fresh.length === 0) fresh = inStock.filter((p) => !p.featured && p.category !== "Accesorios").slice(0, 8);
  const accessories = inStock.filter((p) => p.category === "Accesorios");

  return (
    <>
      <Hero title={site.heroTitle} subtitle={site.heroSubtitle} image={site.heroSlides[0]} />
      {site.categoryNav.enabled && <CategoryRail items={site.categoryNav.items} categories={categories} />}

      {featured.length > 0 && (
        <section className="container-x pt-24">
          <SectionHeading title="Destacados" />
          <ProductGrid products={featured} />
        </section>
      )}

      <section className="container-x pt-24">
        <SectionHeading
          title="Últimos ingresos"
          subtitle="Lo último que entró, con stock para retirar."
          action={<LinkButton href="/catalogo" variant="secondary" className="self-start md:self-auto">Ver el catálogo</LinkButton>}
        />
        <ProductGrid products={fresh} />
      </section>

      <ShopPromo count={accessories.length} />
      <HowWeWork />
      <CanjeCta title={site.canjeTitle} subtitle={site.canjeSubtitle} />
      <Testimonials />

      <section className="container-x grid gap-10 pt-24 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-4">
          <h2 className="text-display text-[30px] md:text-5xl">Preguntas frecuentes</h2>
        </div>
        <div className="md:col-span-8">
          <Faq />
        </div>
      </section>
    </>
  );
}
