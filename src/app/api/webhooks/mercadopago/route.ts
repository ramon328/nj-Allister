import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getMPPayment } from "@/lib/payments/mercadopago";
import { confirmPayment } from "@/lib/payments/confirm";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Notificación de pago de Mercado Pago. Firma: cabecera `x-signature: ts=…,v1=…`
 * y `x-request-id`; v1 = HMAC-SHA256(secret, `id:{data.id};request-id:{x-request-id};ts:{ts};`).
 * La firma se comprueba y se registra, pero la verdad siempre viene de la API de
 * MP con nuestro token: un aviso forjado solo puede hacernos verificar un pago real.
 */
function verifySignature(request: NextRequest, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = request.headers.get("x-signature") ?? "";
  const reqId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(sig.split(",").map((kv) => kv.trim().split("=") as [string, string]));
  if (!parts.ts || !parts.v1 || !reqId) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${reqId};ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return expected.length === parts.v1.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
    const type = body.type ?? request.nextUrl.searchParams.get("type") ?? request.nextUrl.searchParams.get("topic");
    if (type !== "payment") return NextResponse.json({ received: true });
    const dataId = String(request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id") ?? body.data?.id ?? "");
    if (!/^\d{1,20}$/.test(dataId)) return NextResponse.json({ received: true });

    const ip = (request.headers.get("x-real-ip") ?? "").trim() || (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
    const admin = createAdminClient();
    const { data: permitido } = await admin.rpc("rate_allow", { p_key: `mpwh:${ip}`, p_max: 120, p_window_min: 10, p_max_day: 50000 });
    if (permitido !== true) return NextResponse.json({ received: true }, { status: 429 });
    if (!verifySignature(request, dataId)) console.warn("[mp webhook] firma inválida; se verifica igual contra la API", dataId);

    const payment = await getMPPayment(dataId);
    if (!payment.external_reference) return NextResponse.json({ received: true });
    if (["in_process", "pending", "authorized"].includes(payment.status)) {
      await admin.from("orders").update({ payment_state: "processing" }).eq("id", payment.external_reference).eq("status", "pending");
      return NextResponse.json({ received: true });
    }
    if (payment.status !== "approved") return NextResponse.json({ received: true });
    await confirmPayment({ orderId: payment.external_reference, paymentId: String(payment.id), amount: payment.transaction_amount });
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[mp webhook] error", e);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-webhook" });
}
