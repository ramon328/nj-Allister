import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcileOrderPayment } from "@/lib/payments/confirm";
import { sendOrderMail } from "@/features/orders/mail";

export const dynamic = "force-dynamic";

/**
 * Mantenimiento programado (Vercel Cron, ver vercel.json):
 *  - cancela pedidos pendientes con más de 48 h (devuelve el stock)
 *  - concilia con Mercado Pago los pendientes con link (webhook perdido)
 *  - limpia los contadores de límites por IP
 * Vercel manda `Authorization: Bearer ${CRON_SECRET}`; sin secreto no hace nada.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(auth) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = createAdminClient();
  const { data: conLink } = await db.from("orders").select("id").eq("status", "pending").eq("payment_method", "mercadopago").lt("updated_at", new Date(Date.now() - 3 * 60_000).toISOString()).limit(100);
  let reconciled = 0;
  for (const { id } of conLink ?? []) if ((await reconcileOrderPayment(id)) === "paid") reconciled++;
  const { data: expired, error } = await db.rpc("expire_pending_orders", { p_hours: 48 });
  if (error) {
    console.error("[cron]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  for (const id of (expired ?? []) as string[]) await sendOrderMail(id, "cancelled");
  await db.rpc("rate_limits_cleanup");
  console.log(`[cron] vencidos: ${expired?.length ?? 0} · conciliados: ${reconciled}`);
  return NextResponse.json({ ok: true, expired: expired?.length ?? 0, reconciled });
}
