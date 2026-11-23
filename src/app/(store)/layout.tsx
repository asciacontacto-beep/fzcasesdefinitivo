import { getCategories, getShopSettings, getSiteSettings } from "@/lib/catalog";
import { ShopProvider } from "@/components/layout/shop-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { PageViewTracker } from "@/components/layout/page-view-tracker";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [shop, categories, site] = await Promise.all([getShopSettings(), getCategories(), getSiteSettings()]);

  return (
    <ShopProvider value={shop}>
      <Navbar categories={categories} logoUrl={site.logoUrl} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer whatsapp={shop.whatsapp} categories={categories} />
      <CartDrawer />
      <WhatsAppFab />
      <PageViewTracker />
    </ShopProvider>
  );
}
