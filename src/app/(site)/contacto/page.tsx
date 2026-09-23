import type { Metadata } from "next";
import { getSettings } from "@/features/catalog/queries";
import { links } from "@/features/site/data";

export const metadata: Metadata = { title: "Contacto" };

export default async function ContactPage() {
  const s = await getSettings();
  const wa = `https://wa.me/${s.whatsapp ?? "56978792683"}`;
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container container--narrow">
          <p className="eyebrow" data-reveal><span className="eyebrow__dot" />Contacto</p>
          <h1 className="h2" data-split>Hablemos.</h1>
          <div className="contact" data-reveal-group>
            <a href={wa} className="contact__card" target="_blank" rel="noopener"><span>WhatsApp</span><strong>+56 9 7879 2683</strong><small>Lunes a sábado, 10:00 a 19:00</small></a>
            <a href={links.email} className="contact__card"><span>Correo</span><strong>contacto@allister-eyewear.com</strong><small>Respondemos dentro de 24 h hábiles</small></a>
            <a href={links.instagram} className="contact__card" target="_blank" rel="noopener"><span>Instagram</span><strong>@allistereyewear</strong><small>Novedades y lookbook</small></a>
            <div className="contact__card"><span>Dirección</span><strong>Av. Sergio Viera de Mello 4524, Macul, Santiago</strong><small>Tienda exclusivamente online, sin atención presencial</small></div>
          </div>
        </div>
      </section>
    </main>
  );
}
