import type { Metadata } from "next";
import { TrackOrderForm } from "@/features/orders/ui/track-order-form";

export const metadata: Metadata = { title: "Seguir mi pedido" };

export default function TrackPage() {
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container container--narrow">
          <div className="section__head"><p className="eyebrow"><span className="eyebrow__dot" />Pedidos</p><h1 className="h2">Seguir mi <em>pedido.</em></h1><p className="section__sub">Ingresa el número de pedido y el correo con el que compraste. También puedes usar el enlace que te enviamos al correo.</p></div>
          <TrackOrderForm />
        </div>
      </section>
    </main>
  );
}
