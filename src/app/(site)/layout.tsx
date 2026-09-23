import type { ReactNode } from "react";
import { Cursor, TopBar } from "@/features/site/components/Chrome";
import { Footer } from "@/features/site/components/Sections";
import { MotionRoot } from "@/features/site/motion-root";
import { CartDrawer } from "@/features/cart/ui/cart-drawer";
import { getSettings } from "@/features/catalog/queries";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <MotionRoot>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <div className="grain" aria-hidden="true" />
      <Cursor />
      <TopBar announcements={settings.announcement} />
      <CartDrawer freeShippingMin={settings.free_shipping_min_clp} shipping={settings.shipping_clp} />
      {children}
      <Footer />
    </MotionRoot>
  );
}
