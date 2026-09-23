"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { safeEqualHex } from "@/lib/auth/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { createMPPreference, mpConfigured } from "@/lib/payments/mercadopago";

const input = z.object({ orderId: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{48}$/), acceptedTotal: z.number().int().nonnegative() });

/**
 * Inicia el pago de un pedido pendiente en Mercado Pago: crea la preferencia,
 * guarda la URL en el pedido y redirige al Checkout Pro. `acceptedTotal` es el
 * total que el comprador vio y aceptó; si cambió (envío fijado por el admin),
 * se vuelve al pedido para que lo vea antes de pagar.
 */
export async function startGuestPayment(rawOrderId: string, rawToken: string, rawAcceptedTotal: number): Promise<never> {
  const parsed = input.safeParse({ orderId: rawOrderId, token: rawToken, acceptedTotal: rawAcceptedTotal });
  if (!parsed.success) redirect("/");
  const { orderId, token, acceptedTotal } = parsed.data;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, number, status, total_clp, subtotal_clp, shipping_clp, payment_url, payment_method, payment_amount_clp, guest_email, guest_token")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !safeEqualHex(order.guest_token, token)) redirect("/");
  const back = `/pedido/${orderId}?k=${token}`;
  // La vuelta desde MP no lleva el token: cookie httpOnly acotada a la ruta del pedido.
  (await cookies()).set(`pedido_${orderId}`, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: `/pedido/${orderId}`, maxAge: 60 * 60 * 24 * 30 });
  if (order.status !== "pending") redirect(back);
  if (!mpConfigured()) redirect(`${back}&pago=sin-configurar`);
  const amount = order.total_clp;
  if (amount !== acceptedTotal) redirect(`${back}&total=cambio`);
  if (order.payment_url && order.payment_method === "mercadopago" && order.payment_amount_clp === amount) redirect(order.payment_url);

  const origin = publicEnv.siteUrl;
  const { data: items } = await admin.from("order_items").select("name, variant_label, quantity, unit_price_clp, image_url").eq("order_id", orderId);
  let paymentUrl: string;
  let paymentId: string;
  try {
    const r = await createMPPreference({
      orderId,
      orderNumber: order.number,
      items: (items ?? []).map((i) => ({ title: i.variant_label ? `${i.name} · ${i.variant_label}` : i.name, quantity: i.quantity, unit_price: i.unit_price_clp, picture_url: i.image_url })),
      shipping: order.shipping_clp,
      email: order.guest_email,
      returnUrl: `${origin}/pedido/${orderId}`,
      webhookUrl: `${origin}/api/webhooks/mercadopago`,
    });
    paymentUrl = r.initPoint;
    paymentId = r.preferenceId;
  } catch (e) {
    console.error("[mp] preferencia", e);
    redirect(`${back}&pago=error`);
  }
  await admin.from("orders").update({ payment_method: "mercadopago", payment_id: paymentId, payment_url: paymentUrl, payment_amount_clp: amount }).eq("id", orderId);
  redirect(paymentUrl);
}
