import type { Metadata } from "next";
import { GuestCheckoutForm } from "@/features/orders/ui/guest-checkout-form";
import { getSettings } from "@/features/catalog/queries";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container">
          <div className="section__head"><p className="eyebrow"><span className="eyebrow__dot" />Checkout</p><h1 className="h2">Datos de <em>entrega.</em></h1></div>
          <GuestCheckoutForm freeShippingMin={s.free_shipping_min_clp} shipping={s.shipping_clp} />
        </div>
      </section>
    </main>
  );
}
