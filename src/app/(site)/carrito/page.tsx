import type { Metadata } from "next";
import { CartPage } from "@/features/cart/ui/cart-page";
import { getSettings } from "@/features/catalog/queries";

export const metadata: Metadata = { title: "Tu carro", robots: { index: false } };

export default async function CarritoPage() {
  const s = await getSettings();
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container container--narrow">
          <div className="section__head"><p className="eyebrow"><span className="eyebrow__dot" />Carro</p><h1 className="h2">Tu <em>carro.</em></h1></div>
          <CartPage freeShippingMin={s.free_shipping_min_clp} shipping={s.shipping_clp} />
        </div>
      </section>
    </main>
  );
}
