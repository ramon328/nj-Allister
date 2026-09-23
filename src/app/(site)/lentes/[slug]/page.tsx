import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getProduct, getSettings, relatedProducts, siblingProducts } from "@/features/catalog/queries";
import { Gallery } from "@/features/catalog/ui/gallery";
import { ProductCard } from "@/features/catalog/ui/product-card";
import { AddToCart } from "@/features/cart/ui/add-to-cart";
import { formatCLP, pctOff } from "@/lib/format";
import { publicEnv } from "@/lib/env";

const KIND: Record<string, string> = { sol: "Anteojos de sol", optico: "Anteojos ópticos", lectura: "Anteojos de lectura" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Producto no encontrado" };
  return { title: p.name, description: p.description?.slice(0, 160) ?? `${KIND[p.kind]} ${p.name}`, openGraph: { images: p.image_url ? [p.image_url] : undefined } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const [siblings, related, settings] = await Promise.all([siblingProducts(p), relatedProducts(p), getSettings()]);
  const images = [p.image_url, ...p.gallery_images].filter((u): u is string => Boolean(u));
  const off = pctOff(p.price_clp, p.compare_price_clp);
  const wa = `https://wa.me/${settings.whatsapp ?? publicEnv.whatsapp}?text=${encodeURIComponent(`Hola, me interesa ${p.name} (${p.sku})`)}`;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, image: images, description: p.description ?? undefined, brand: { "@type": "Brand", name: "Allister Eyewear" },
    offers: { "@type": "Offer", priceCurrency: "CLP", price: p.price_clp, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${publicEnv.siteUrl}/lentes/${p.slug}` },
  };
  return (
    <main id="contenido" className="page page--inner">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="section section--top product">
        <div className="container product__grid">
          <div className="product__gallery" data-reveal><Gallery images={images} name={p.name} /></div>
          <div className="product__info">
            <nav className="crumbs" aria-label="Ruta"><a href="/coleccion">Catálogo</a><span>/</span><a href={`/coleccion?tipo=${p.kind}`}>{KIND[p.kind]}</a></nav>
            <h1 className="h2" data-split>{p.name}</h1>
            <p className="product__kicker" data-reveal>{p.sku}{p.color_label ? ` · ${p.color_label}` : ""}</p>
            <p className="product__price" data-reveal data-delay="0.1">
              <span>{formatCLP(p.price_clp)}</span>
              {p.compare_price_clp ? <><s>{formatCLP(p.compare_price_clp)}</s><em>−{off}%</em></> : null}
            </p>
            {siblings.length > 0 ? (
              <div className="product__colors" data-reveal data-delay="0.15">
                <p className="field-label">Otros colores</p>
                <div className="swatches">
                  <span className="swatch is-on" title={p.color_label ?? p.name}>{p.image_url ? <Image src={p.image_url} alt="" width={64} height={64} /> : null}</span>
                  {siblings.map((s) => (
                    <a key={s.id} href={`/lentes/${s.slug}`} className="swatch" title={s.color_label ?? s.name}>{s.image_url ? <Image src={s.image_url} alt={s.color_label ?? s.name} width={64} height={64} /> : null}</a>
                  ))}
                </div>
              </div>
            ) : null}
            <div data-reveal data-delay="0.2"><AddToCart product={p} /></div>
            <ul className="product__perks" data-reveal-group>
              {p.features.map((f) => <li key={f}>{f}</li>)}
              <li>3 años de garantía</li>
              <li>Estuche y paño incluidos</li>
              <li>Envío gratis desde {formatCLP(settings.free_shipping_min_clp)}</li>
            </ul>
            {p.description ? <div className="product__desc" data-reveal>{p.description.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}</div> : null}
            <a href={wa} className="link-underline product__wa" target="_blank" rel="noopener">¿Dudas? Escríbenos por WhatsApp</a>
          </div>
        </div>
      </section>
      {related.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow" data-reveal><span className="eyebrow__dot" />También te puede gustar</p>
              <h2 className="h2" data-split>Más <em>{KIND[p.kind].toLowerCase().replace("anteojos ", "")}.</em></h2>
            </div>
            <div className="pgrid" data-reveal-group>{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
