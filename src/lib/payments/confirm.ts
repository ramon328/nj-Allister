import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderMail, sendSaleNoticeMail } from "@/features/orders/mail";
import { mpFindPayment } from "@/lib/payments/mercadopago";

/**
 * Marca un pedido como pagado. Solo lo llaman el webhook y la conciliación,
 * nunca el redirect del navegador. Idempotente. Cualquier anomalía queda
 * registrada en order_events (interna) para que el admin la revise.
 */
export async function confirmPayment(opts: { orderId: string; paymentId: string; amount: number }): Promise<{ ok: boolean; reason?: string }> {
  const supabase = createAdminClient();
  const flag = async (note: string) => {
    await supabase.from("order_events").insert({ order_id: opts.orderId, from_status: null, to_status: "pending", actor_id: null, note: `⚠ REVISAR PAGO (mercadopago ${opts.paymentId}): ${note}`, internal: true });
  };

  const { data: order, error } = await supabase.from("orders").select("id, status, total_clp, payment_id").eq("id", opts.orderId).maybeSingle();
  if (error || !order) return { ok: false, reason: "order_not_found" };

  if (order.status === "paid") {
    if (order.payment_id !== opts.paymentId) await flag(`segundo pago recibido por $${opts.amount} sobre un pedido ya pagado con ${order.payment_id}. Posible doble cobro: devolver.`);
    return { ok: true, reason: "already_paid" };
  }
  if (order.status !== "pending") {
    await flag(`llegó un pago de $${opts.amount} pero el pedido está en estado ${order.status}. Devolver.`);
    return { ok: false, reason: `invalid_status:${order.status}` };
  }
  if (opts.amount < order.total_clp) {
    await flag(`monto insuficiente: cobrado $${opts.amount}, pedido $${order.total_clp}. Cobrar diferencia o devolver.`);
    return { ok: false, reason: "amount_mismatch" };
  }

  const { data: updated, error: updateErr } = await supabase
    .from("orders")
    .update({ status: "paid", payment_method: "mercadopago", payment_id: opts.paymentId, payment_amount_clp: opts.amount, paid_at: new Date().toISOString(), payment_state: null })
    .eq("id", opts.orderId)
    .eq("status", "pending") // bloqueo optimista
    .select("id");
  if (updateErr) {
    console.error("[payment] update failed", updateErr);
    return { ok: false, reason: "update_failed" };
  }
  if (!updated?.length) {
    await flag(`pago de $${opts.amount} llegó mientras el pedido cambiaba de estado. Revisar.`);
    return { ok: false, reason: "raced" };
  }
  console.log(`[payment] pedido ${opts.orderId} pagado (mp ${opts.paymentId})`);
  await sendOrderMail(opts.orderId, "paid");
  await sendSaleNoticeMail(opts.orderId);
  return { ok: true };
}

export type Reconciliation = "paid" | "processing" | "none";

/** Red de seguridad si el webhook no llegó: busca en MP un pago aprobado con external_reference = pedido. */
export async function reconcileOrderPayment(orderId: string): Promise<Reconciliation> {
  try {
    const supabase = createAdminClient();
    const { data: order } = await supabase.from("orders").select("id, status, payment_method").eq("id", orderId).maybeSingle();
    if (!order || order.status !== "pending" || order.payment_method !== "mercadopago") return "none";
    const pago = await mpFindPayment(orderId);
    if (!pago) return "none";
    if (pago.status !== "approved") {
      if (["in_process", "pending", "authorized"].includes(pago.status)) {
        await supabase.from("orders").update({ payment_state: "processing" }).eq("id", orderId).eq("status", "pending");
        return "processing";
      }
      return "none";
    }
    console.log(`[payment] conciliación: pedido ${orderId} con pago aprobado ${pago.id} sin webhook`);
    const r = await confirmPayment({ orderId, paymentId: String(pago.id), amount: pago.transaction_amount });
    return r.ok ? "paid" : "none";
  } catch (e) {
    console.error("[payment] conciliación", orderId, e);
    return "none";
  }
}
