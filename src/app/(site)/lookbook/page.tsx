import type { Metadata } from "next";
import Image from "next/image";
import { lookbookRowA, lookbookRowB, links } from "@/features/site/data";

export const metadata: Metadata = { title: "Lookbook" };

const extra = [
  { src: "/assets/web/hero-sol-sin-reflejos.jpg", alt: "Hombre con sombrero y anteojos espejados" },
  { src: "/assets/web/banner-mujer-rubia-terraza.jpg", alt: "Mujer con anteojos de sol en una terraza" },
  { src: "/assets/web/banner-hombre-jeep.jpg", alt: "Pareja con anteojos de sol junto a un muro" },
  { src: "/assets/web/hero-filtro-azul.jpg", alt: "Pareja leyendo con anteojos de filtro azul" },
  { src: "/assets/web/banner-luxe-ryder-mujer.jpg", alt: "Mujer con anteojos Ryder espejados" },
  { src: "/assets/web/banner-ofertas-hombre-sombrero.jpg", alt: "Hombre con sombrero frente a máquinas de chicles" },
];

export default function LookbookPage() {
  const all = [...extra, ...lookbookRowA, ...lookbookRowB];
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container">
          <div className="section__head"><p className="eyebrow" data-reveal><span className="eyebrow__dot" />Lookbook</p><h1 className="h2" data-split>Así se ven <em>en la calle.</em></h1><span data-reveal><a href={links.instagram} className="link-underline">@allistereyewear</a></span></div>
          <div className="masonry" data-reveal-group>
            {all.map((i, n) => (
              <figure key={i.src} className={`masonry__item ${n % 5 === 0 ? "is-wide" : ""}`} data-clip="circle"><Image src={i.src} alt={i.alt} width={1200} height={1200} sizes="(max-width: 768px) 50vw, 33vw" /></figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
