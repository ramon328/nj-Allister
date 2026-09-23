import type { Metadata } from "next";
import { Filters, buildHref } from "@/features/catalog/ui/filters";
import { ProductCard } from "@/features/catalog/ui/product-card";
import { PAGE_SIZE, getCollection, listCollections, listProducts, type CatalogFilters } from "@/features/catalog/queries";

export const metadata: Metadata = { title: "Colección", description: "Anteojos de sol polarizados, ópticos con filtro azul y lectura magnéticos. Envío a todo Chile." };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CollectionPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f: CatalogFilters = {
    q: one(sp.q).slice(0, 60) || undefined,
    collection: one(sp.c) || undefined,
    kind: one(sp.tipo) || undefined,
    sort: (["nuevo", "precio-asc", "precio-desc", "oferta"].includes(one(sp.orden)) ? one(sp.orden) : undefined) as CatalogFilters["sort"],
    page: Math.max(1, Number(one(sp.p)) || 1),
  };
  const [collections, { items, total }, current] = await Promise.all([listCollections(), listProducts(f), f.collection ? getCollection(f.collection) : Promise.resolve(null)]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container">
          <div className="section__head">
            <p className="eyebrow" data-reveal><span className="eyebrow__dot" />{current ? "Colección" : "Catálogo"}</p>
            <h1 className="h2" data-split>{current ? current.name : f.q ? <>Resultados para <em>“{f.q}”</em></> : <>Todos los <em>modelos.</em></>}</h1>
            {current?.description ? <p className="section__sub" data-reveal>{current.description}</p> : null}
          </div>
          <Filters f={f} collections={collections} total={total} />
          {items.length === 0 ? (
            <div className="empty"><p>No encontramos modelos con esos filtros.</p><a href="/coleccion" className="link-underline">Ver todo el catálogo</a></div>
          ) : (
            <div className="pgrid" data-reveal-group>
              {items.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}
            </div>
          )}
          {pages > 1 ? (
            <nav className="pager" aria-label="Páginas">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <a key={n} href={buildHref(f, { p: n > 1 ? String(n) : "" })} className={`chip chip--sm ${n === f.page ? "is-on" : ""}`} aria-current={n === f.page ? "page" : undefined}>{n}</a>
              ))}
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  );
}
