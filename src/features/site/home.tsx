"use client";
import { useCallback, useState } from "react";
import { Loader } from "./components/Chrome";
import { Benefits, Collections, Hero, Journal, Lookbook, Marquee, Newsletter, Story, Zoom } from "./components/Sections";
import { Eyebrow, LinkUnderline } from "./components/ui";
import { ProductCard } from "@/features/catalog/ui/product-card";
import type { ProductCard as Card } from "@/features/catalog/queries";
import type { CollectionView } from "@/lib/supabase/database.types";

export function Home({ products, collections }: { products: Card[]; collections: CollectionView[] }) {
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => setReady(true), []);
  return (
    <>
      <Loader onDone={onLoaded} />
      <main id="contenido">
        <div className="hero-wrap"><Hero ready={ready} /></div>
        <div className="page">
          <Marquee />
          <Collections collections={collections} />
          {products.length > 0 ? (
            <section className="section featured" id="destacados">
              <div className="container">
                <div className="section__head">
                  <Eyebrow data-reveal>Lo más buscado</Eyebrow>
                  <h2 className="h2" data-split>Los favoritos<br /><em>de esta temporada.</em></h2>
                  <span data-reveal data-delay="0.3"><LinkUnderline href="/coleccion">Ver todo el catálogo</LinkUnderline></span>
                </div>
                <div className="pgrid" data-reveal-group>
                  {products.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
              </div>
            </section>
          ) : null}
          <Story />
          <Zoom />
          <Benefits />
          <Lookbook />
          <Journal />
          <Newsletter />
        </div>
      </main>
    </>
  );
}
