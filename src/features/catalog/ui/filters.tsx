import type { CollectionView } from "@/lib/supabase/database.types";
import type { CatalogFilters } from "../queries";

const KINDS = [
  { v: "", l: "Todos" },
  { v: "sol", l: "Sol" },
  { v: "optico", l: "Ópticos" },
  { v: "lectura", l: "Lectura" },
];
const SORTS = [
  { v: "", l: "Recomendados" },
  { v: "oferta", l: "Mayor descuento" },
  { v: "precio-asc", l: "Menor precio" },
  { v: "precio-desc", l: "Mayor precio" },
];

export function buildHref(f: CatalogFilters, patch: Partial<Record<"c" | "tipo" | "orden" | "q" | "p", string>>) {
  const merged: Record<string, string> = { c: f.collection ?? "", tipo: f.kind ?? "", orden: f.sort ?? "", q: f.q ?? "", ...patch };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
  const s = p.toString();
  return `/coleccion${s ? `?${s}` : ""}`;
}

export function Filters({ f, collections, total }: { f: CatalogFilters; collections: CollectionView[]; total: number }) {
  return (
    <div className="filters">
      <nav className="chips chips--scroll" aria-label="Colecciones">
        <a href={buildHref(f, { c: "" })} className={`chip ${!f.collection ? "is-on" : ""}`}>Todo</a>
        {collections.map((c) => (
          <a key={c.slug} href={buildHref(f, { c: c.slug })} className={`chip ${f.collection === c.slug ? "is-on" : ""}`}>
            {c.name} <small>{c.product_count}</small>
          </a>
        ))}
      </nav>
      <div className="filters__tools">
        <nav className="chips" aria-label="Tipo">
          {KINDS.map((k) => (
            <a key={k.v} href={buildHref(f, { tipo: k.v })} className={`chip chip--sm ${(f.kind ?? "") === k.v ? "is-on" : ""}`}>{k.l}</a>
          ))}
        </nav>
        <form action="/coleccion" className="filters__search" role="search">
          {f.collection ? <input type="hidden" name="c" value={f.collection} /> : null}
          {f.kind ? <input type="hidden" name="tipo" value={f.kind} /> : null}
          {f.sort ? <input type="hidden" name="orden" value={f.sort} /> : null}
          <input type="search" name="q" defaultValue={f.q ?? ""} placeholder="Buscar modelo o color" className="input input--sm" aria-label="Buscar" />
        </form>
        <nav className="chips" aria-label="Ordenar">
          {SORTS.map((s) => (
            <a key={s.v} href={buildHref(f, { orden: s.v })} className={`chip chip--sm chip--ghost ${(f.sort ?? "") === s.v ? "is-on" : ""}`}>{s.l}</a>
          ))}
        </nav>
        <p className="filters__count">{total} {total === 1 ? "modelo" : "modelos"}</p>
      </div>
    </div>
  );
}
