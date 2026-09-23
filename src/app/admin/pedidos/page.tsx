import { listOrders } from "@/features/orders/queries";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/features/orders/schemas";
import { formatCLP, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui";
import type { OrderStatus } from "@/lib/supabase/database.types";

type SP = Record<string, string | string[] | undefined>;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = typeof sp.estado === "string" && ORDER_STATUSES.includes(sp.estado as OrderStatus) ? (sp.estado as OrderStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : undefined;
  const orders = await listOrders(status, q);
  return (
    <div className="stack">
      <h1 className="h2">Pedidos</h1>
      <div className="filters__tools">
        <nav className="chips" aria-label="Estado">
          <a href="/admin/pedidos" className={`chip chip--sm ${!status ? "is-on" : ""}`}>Todos</a>
          {ORDER_STATUSES.map((s) => <a key={s} href={`/admin/pedidos?estado=${s}`} className={`chip chip--sm ${status === s ? "is-on" : ""}`}>{ORDER_STATUS_LABEL[s].label}</a>)}
        </nav>
        <form action="/admin/pedidos" className="filters__search"><input type="search" name="q" defaultValue={q ?? ""} placeholder="N°, correo o nombre" className="input input--sm" /></form>
      </div>
      <table className="atable">
        <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Comuna</th><th>Unid.</th><th>Total</th><th>Pago</th><th>Estado</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><a href={`/admin/pedidos/${o.id}`} className="link-underline">#{o.number}</a></td>
              <td>{formatDateTime(o.created_at)}</td>
              <td>{o.guest_name}<br /><small>{o.guest_email}</small></td>
              <td>{o.address?.comuna}</td>
              <td>{o.units}</td>
              <td>{formatCLP(o.total_clp)}</td>
              <td>{o.paid_at ? "MP ✓" : o.payment_state === "processing" ? "En revisión" : o.payment_url ? "Link creado" : "—"}</td>
              <td><Badge tone={ORDER_STATUS_LABEL[o.status].tone}>{ORDER_STATUS_LABEL[o.status].label}</Badge></td>
            </tr>
          ))}
          {orders.length === 0 ? <tr><td colSpan={8} className="muted">Sin pedidos.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
