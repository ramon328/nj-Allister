import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { safeEqualHex } from "@/lib/auth/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcileOrderPayment } from "@/lib/payments/confirm";
import { getOrderGuest } from "@/features/orders/queries";
import { CancelOrder, OrderStatusBadge, OrderSummary, PayOrder, PaymentReturnBanner } from "@/features/orders/ui/order-view";
import { Banner } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Pedido de invitado: acceso con el token del enlace (?k=) o la cookie sembrada al pagar. */
export default async function GuestOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();
  const cookieToken = (await cookies()).get(`pedido_${id}`)?.value ?? "";
  const k = one(sp.k);
  const token = /^[a-f0-9]{48}$/.test(k) ? k : /^[a-f0-9]{48}$/.test(cookieToken) ? cookieToken : "";
  if (!token) redirect("/pedido");
  const { data: raw } = await createAdminClient().from("orders").select("guest_token").eq("id", id).maybeSingle();
  if (!safeEqualHex(raw?.guest_token, token)) notFound();
  const conciliado = await reconcileOrderPayment(id);
  const detail = await getOrderGuest(id);
  if (!detail) notFound();
  const { order: o, items, events } = detail;
  const estado = one(sp.estado);
  const nuevo = one(sp.nuevo) === "1";
  return (
    <main id="contenido" className="page page--inner">
      <section className="section section--top">
        <div className="container container--narrow">
          <div className="order__head">
            <div>
              <p className="eyebrow"><span className="eyebrow__dot" />Pedido</p>
              <h1 className="h2">Pedido <em>#{o.number}</em></h1>
              <p className="muted">{formatDateTime(o.created_at)} · {o.guest_name}</p>
            </div>
            <OrderStatusBadge status={o.status} processing={conciliado === "processing" || o.payment_state === "processing"} />
          </div>
          {nuevo ? <Banner tone="success">Recibimos tu pedido y reservamos tus anteojos. Guarda este enlace (también va a tu correo): es tu acceso para pagar y seguirlo.</Banner> : null}
          <PaymentReturnBanner estado={conciliado === "processing" ? "pendiente" : estado || undefined} status={o.status} pago={one(sp.pago) || undefined} />
          {o.status === "pending" ? <PayOrder orderId={o.id} token={token} total={o.total_clp} totalChanged={one(sp.total) === "cambio"} /> : null}
          <OrderSummary order={o} items={items} events={events} />
          {o.status === "pending" ? <CancelOrder orderId={o.id} token={token} /> : null}
          <p className="muted">¿Dudas con tu pedido? Escríbenos a contacto@allister-eyewear.com o por WhatsApp indicando el número #{o.number}.</p>
        </div>
      </section>
    </main>
  );
}
