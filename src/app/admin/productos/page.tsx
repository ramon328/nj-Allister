import Image from "next/image";
import { adminListProducts } from "@/features/catalog/queries";
import { StockInline } from "@/features/admin/ui/forms";
import { formatCLP } from "@/lib/format";

type SP = Record<string, string | string[] | undefined>;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : undefined;
  const kind = typeof sp.tipo === "string" ? sp.tipo : undefined;
  const inactive = sp.inactivos === "1";
  const products = await adminListProducts({ q, kind, inactive });
  return (
    <div className="stack">
      <div className="order__head"><h1 className="h2">Productos <small className="muted">{products.length}</small></h1><a href="/admin/productos/nuevo" className="btn btn--dark"><span>Nuevo producto</span></a></div>
      <div className="filters__tools">
        <nav className="chips" aria-label="Tipo">
          {[["", "Todos"], ["sol", "Sol"], ["optico", "Ópticos"], ["lectura", "Lectura"]].map(([v, l]) => <a key={v} href={`/admin/productos?tipo=${v}${inactive ? "&inactivos=1" : ""}`} className={`chip chip--sm ${(kind ?? "") === v ? "is-on" : ""}`}>{l}</a>)}
          <a href={`/admin/productos?inactivos=${inactive ? "0" : "1"}`} className={`chip chip--sm ${inactive ? "is-on" : ""}`}>Incluir ocultos</a>
        </nav>
        <form action="/admin/productos" className="filters__search"><input type="search" name="q" defaultValue={q ?? ""} placeholder="Nombre o SKU" className="input input--sm" /></form>
      </div>
      <table className="atable">
        <thead><tr><th /><th>Producto</th><th>SKU</th><th>Tipo</th><th>Precio</th><th>Stock</th><th>Estado</th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={p.stock <= 2 ? "is-low" : ""}>
              <td className="atable__img">{p.image_url ? <Image src={p.image_url} alt="" width={48} height={48} /> : null}</td>
              <td><a href={`/admin/productos/${p.id}`} className="link-underline">{p.name}</a><br /><small>{p.color_label}</small></td>
              <td>{p.sku}</td><td>{p.kind}</td>
              <td>{formatCLP(p.price_clp)}{p.compare_price_clp ? <><br /><s className="muted">{formatCLP(p.compare_price_clp)}</s></> : null}</td>
              <td><StockInline id={p.id} stock={p.stock} /></td>
              <td>{p.active ? (p.featured ? "Destacado" : "Visible") : "Oculto"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
