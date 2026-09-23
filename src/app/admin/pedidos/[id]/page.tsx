import { notFound } from "next/navigation";
import { z } from "zod";
import { getOrderAdmin } from "@/features/orders/queries";
import { ORDER_STATUS_LABEL } from "@/features/orders/schemas";
import { AdminOrderForm } from "@/features/admin/ui/forms";
import { OrderSummary } from "@/features/orders/ui/order-view";
import { getSessionProfile } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [detail, me] = await Promise.all([getOrderAdmin(id), getSessionProfile()]);
  if (!detail) notFound();
  const { order: o, items, events } = detail;
  const internal = events.filter((e) => e.internal);
  return (
    <div className="stack">
      <div className="order__head">
        <div><a href="/admin/pedidos" className="link-underline">← Pedidos</a><h1 className="h2">Pedido #{o.number}</h1><p className="muted">{formatDateTime(o.created_at)} · {o.guest_phone} · {o.guest_email}</p></div>
        <Badge tone={ORDER_STATUS_LABEL[o.status].tone}>{ORDER_STATUS_LABEL[o.status].label}</Badge>
      </div>
      {internal.length > 0 ? <div className="banner banner--warn"><strong>Alertas de pago:</strong><ul>{internal.map((e) => <li key={e.id}>{formatDateTime(e.created_at)} · {e.note}</li>)}</ul></div> : null}
      <div className="admin__two">
        <OrderSummary order={o} items={items} events={events.filter((e) => !e.internal)} />
        <AdminOrderForm order={o} superadmin={me?.role === "superadmin"} />
      </div>
      {o.payment_url && o.status === "pending" ? <p className="muted">Link de pago vigente: <a href={o.payment_url} className="link-underline" target="_blank" rel="noopener">abrir en Mercado Pago</a> · Enlace del cliente: <code>/pedido/{o.id}?k={o.guest_token}</code></p> : null}
    </div>
  );
}
