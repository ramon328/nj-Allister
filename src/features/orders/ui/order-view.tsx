"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { Badge, Banner, Btn } from "@/components/ui";
import { formatCLP, formatDateTime } from "@/lib/format";
import type { OrderEventRow, OrderItemRow, OrderStatus, OrderView } from "@/lib/supabase/database.types";
import { ORDER_STATUS_LABEL } from "../schemas";
import { startGuestPayment } from "../payment-actions";
import { cancelGuestOrder } from "../actions";

export function OrderStatusBadge({ status, processing }: { status: OrderStatus; processing?: boolean }) {
  if (status === "pending" && processing) return <Badge tone="info">Pago en revisión</Badge>;
  const s = ORDER_STATUS_LABEL[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function OrderSummary({ order, items, events }: { order: OrderView; items: OrderItemRow[]; events: OrderEventRow[] }) {
  const a = order.address;
  return (
    <div className="order">
      <section className="order__items">
        <h2 className="h3">Productos</h2>
        <ul className="summary summary--lg">
          {items.map((i) => (
            <li key={i.id}>
              <span className="summary__img">{i.image_url ? <Image src={i.image_url} alt="" width={80} height={80} /> : null}<b>{i.quantity}</b></span>
              <span className="summary__name">{i.name}<small>{[i.sku, i.variant_label].filter(Boolean).join(" · ")}</small></span>
              <span className="summary__price">{formatCLP(i.unit_price_clp * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="totals">
          <div><dt>Subtotal</dt><dd>{formatCLP(order.subtotal_clp)}</dd></div>
          {order.discount_clp > 0 ? <div className="totals__off"><dt>Descuento {order.promo_code ? `(${order.promo_code})` : ""}</dt><dd>−{formatCLP(order.discount_clp)}</dd></div> : null}
          <div><dt>Despacho</dt><dd>{order.shipping_clp > 0 ? formatCLP(order.shipping_clp) : "Gratis"}</dd></div>
          <div className="totals__total"><dt>Total</dt><dd>{formatCLP(order.total_clp)}</dd></div>
        </dl>
      </section>
      <section className="order__side">
        <h2 className="h3">Entrega</h2>
        <p className="order__addr">{order.guest_name}<br />{a.street} {a.number}{a.apartment ? `, ${a.apartment}` : ""}<br />{a.comuna}, {a.region}{a.postal_code ? ` · ${a.postal_code}` : ""}<br />{order.guest_phone} · {order.guest_email}</p>
        {order.notes ? <p className="muted">Indicaciones: {order.notes}</p> : null}
        {order.tracking ? <p><strong>Seguimiento:</strong> {order.tracking}</p> : null}
        <h2 className="h3">Historial</h2>
        <ol className="timeline">
          {events.map((e) => (
            <li key={e.id}><time>{formatDateTime(e.created_at)}</time><span>{ORDER_STATUS_LABEL[e.to_status].label}</span></li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function PaymentReturnBanner({ estado, status, pago }: { estado?: string; status: OrderStatus; pago?: string }) {
  if (pago === "sin-configurar") return <Banner tone="warn">Los pagos en línea aún no están habilitados. Escríbenos por WhatsApp para coordinar el pago.</Banner>;
  if (pago === "error") return <Banner tone="error">No pudimos conectar con Mercado Pago. Intenta de nuevo en un momento.</Banner>;
  if (!estado) return null;
  if (estado === "ok" && status === "pending") return <Banner tone="info">Mercado Pago aprobó el pago. Estamos confirmándolo, en unos segundos se actualiza.</Banner>;
  if (estado === "ok") return <Banner tone="success">Pago confirmado. Gracias por tu compra.</Banner>;
  if (estado === "pendiente") return <Banner tone="info">Tu pago quedó en revisión por Mercado Pago. Te avisaremos por correo cuando se confirme.</Banner>;
  if (estado === "error") return <Banner tone="error">El pago no se completó. Puedes intentar de nuevo con otro medio.</Banner>;
  return null;
}

/** Aceptación expresa del total (Ley 19.496) + inicio del pago en Mercado Pago. */
export function PayOrder({ orderId, token, total, totalChanged }: { orderId: string; token: string; total: number; totalChanged: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function pay() {
    setError(null);
    start(async () => {
      try {
        await startGuestPayment(orderId, token, total);
      } catch (e) {
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) setError("No se pudo conectar con la pasarela de pago. Intenta de nuevo.");
      }
    });
  }
  return (
    <div className="pay">
      <h2 className="h3">Pagar ahora</h2>
      {totalChanged ? <Banner tone="info">El total de tu pedido cambió (se ajustó el despacho). Revísalo antes de pagar.</Banner> : null}
      <p>Pago seguro vía <strong>Mercado Pago</strong>: tarjeta de crédito, débito, cuotas o saldo en cuenta.</p>
      {error ? <Banner tone="error">{error}</Banner> : null}
      <Btn type="button" size="lg" loading={pending} onClick={pay} className="w-full">Acepto el total de {formatCLP(total)} y pagar</Btn>
      <p className="muted">Te redirigimos a Mercado Pago; Allister no ve ni guarda los datos de tu tarjeta. Confirmado el pago, tu pedido pasa a preparación.</p>
    </div>
  );
}

export function CancelOrder({ orderId, token }: { orderId: string; token: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <button type="button" className="link-underline order__cancel" disabled={pending} onClick={() => { if (confirm("¿Cancelar este pedido? Se liberará el stock reservado.")) start(async () => { const r = await cancelGuestOrder(orderId, token); if (r.ok) { setDone(true); location.reload(); } }); }}>
      {pending ? "Cancelando…" : "Cancelar pedido"}
    </button>
  );
}
