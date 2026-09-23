import { countOrdersByStatus, listOrders, salesSummary } from "@/features/orders/queries";
import { ORDER_STATUS_LABEL } from "@/features/orders/schemas";
import { createClient } from "@/lib/supabase/server";
import { formatCLP, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui";
import { mpConfigured } from "@/lib/payments/mercadopago";
import { mailConfigured } from "@/lib/mail";

export default async function AdminHome() {
  const supabase = await createClient();
  const [counts, sales, recent, { count: products }, { count: lowStock }] = await Promise.all([
    countOrdersByStatus(),
    salesSummary(30),
    listOrders(),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true).lte("stock", 2),
  ]);
  return (
    <div className="stack">
      <h1 className="h2">Resumen</h1>
      <div className="kpis">
        <div className="kpi"><span>Ventas 30 días</span><strong>{formatCLP(sales.revenue)}</strong><small>{sales.orders} pedidos pagados</small></div>
        <div className="kpi"><span>Pendientes de pago</span><strong>{counts.pending}</strong><small>se cancelan solos a las 48 h</small></div>
        <div className="kpi"><span>Por preparar / enviar</span><strong>{counts.paid + counts.preparing}</strong><small>{counts.shipped} enviados</small></div>
        <div className="kpi"><span>Productos activos</span><strong>{products ?? 0}</strong><small>{lowStock ?? 0} con stock ≤ 2</small></div>
      </div>
      {!mpConfigured() ? <div className="banner banner--warn">Mercado Pago no está configurado: falta MP_ACCESS_TOKEN. Los clientes pueden crear pedidos pero no pagar en línea.</div> : null}
      {!mailConfigured() ? <div className="banner banner--info">Correos desactivados: configura RESEND_API_KEY y MAIL_FROM para enviar confirmaciones.</div> : null}
      <h2 className="h3">Últimos pedidos</h2>
      <table className="atable">
        <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>
          {recent.slice(0, 15).map((o) => (
            <tr key={o.id}>
              <td><a href={`/admin/pedidos/${o.id}`} className="link-underline">#{o.number}</a></td>
              <td>{formatDateTime(o.created_at)}</td>
              <td>{o.guest_name}<br /><small>{o.guest_email}</small></td>
              <td>{formatCLP(o.total_clp)}</td>
              <td><Badge tone={ORDER_STATUS_LABEL[o.status].tone}>{ORDER_STATUS_LABEL[o.status].label}</Badge></td>
            </tr>
          ))}
          {recent.length === 0 ? <tr><td colSpan={5} className="muted">Aún no hay pedidos.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
