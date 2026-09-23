import "server-only";
import { sendMail, mailConfigured } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { formatCLP } from "@/lib/format";

export type MailKind = "received" | "paid" | "shipped" | "cancelled";

const SUBJECT: Record<MailKind, (n: number) => string> = {
  received: (n) => `Recibimos tu pedido #${n} · Allister Eyewear`,
  paid: (n) => `Pago confirmado · Pedido #${n}`,
  shipped: (n) => `Tu pedido #${n} va en camino`,
  cancelled: (n) => `Pedido #${n} cancelado`,
};
const INTRO: Record<MailKind, string> = {
  received: "Reservamos tus anteojos. Para confirmar el pedido, paga desde el enlace de abajo. El enlace también sirve para seguir tu pedido.",
  paid: "Tu pago fue confirmado. Estamos preparando tu pedido y te avisaremos cuando salga.",
  shipped: "Tu pedido salió a despacho. Si hay número de seguimiento, lo encuentras más abajo.",
  cancelled: "Tu pedido fue cancelado y las unidades volvieron a estar disponibles. Si fue un error, vuelve a comprar cuando quieras.",
};

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function layout(title: string, body: string, cta?: { href: string; label: string }) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4efe7;font-family:Helvetica,Arial,sans-serif;color:#151311">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <p style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#5e5750;margin:0 0 20px">Allister Eyewear®</p>
    <h1 style="font-size:26px;line-height:1.1;margin:0 0 14px;font-weight:600">${title}</h1>
    ${body}
    ${cta ? `<p style="margin:26px 0"><a href="${cta.href}" style="display:inline-block;background:#151311;color:#f4efe7;text-decoration:none;padding:13px 22px;border-radius:999px;font-size:14px">${esc(cta.label)}</a></p>` : ""}
    <p style="font-size:12px;color:#948c82;margin-top:32px">Allister Eyewear · Av. Sergio Viera de Mello 4524, Macul, Santiago · contacto@allister-eyewear.com · WhatsApp +56 9 7879 2683</p>
  </div></body></html>`;
}

/** Correo por estado de pedido. Idempotente por (pedido, tipo). */
export async function sendOrderMail(orderId: string, kind: MailKind): Promise<void> {
  if (!mailConfigured()) return;
  try {
    const admin = createAdminClient();
    const { data: o } = await admin.from("orders").select("id, number, status, guest_email, guest_name, guest_token, subtotal_clp, discount_clp, shipping_clp, total_clp, tracking, address").eq("id", orderId).maybeSingle();
    if (!o) return;
    const { data: items } = await admin.from("order_items").select("name, variant_label, quantity, unit_price_clp").eq("order_id", orderId);
    const link = `${publicEnv.siteUrl}/pedido/${o.id}?k=${o.guest_token}`;
    const rows = (items ?? []).map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #e6dfd2">${esc(i.name)}${i.variant_label ? ` · ${esc(i.variant_label)}` : ""} × ${i.quantity}</td><td style="padding:6px 0;border-bottom:1px solid #e6dfd2;text-align:right">${formatCLP(i.unit_price_clp * i.quantity)}</td></tr>`).join("");
    const totals = `<tr><td style="padding-top:10px;color:#5e5750">Productos</td><td style="padding-top:10px;text-align:right">${formatCLP(o.subtotal_clp)}</td></tr>
      ${o.discount_clp > 0 ? `<tr><td style="color:#5e5750">Descuento</td><td style="text-align:right">−${formatCLP(o.discount_clp)}</td></tr>` : ""}
      <tr><td style="color:#5e5750">Despacho</td><td style="text-align:right">${o.shipping_clp > 0 ? formatCLP(o.shipping_clp) : "Gratis"}</td></tr>
      <tr><td style="padding-top:8px;font-weight:600">Total</td><td style="padding-top:8px;text-align:right;font-weight:600">${formatCLP(o.total_clp)}</td></tr>`;
    const a = o.address as Record<string, string | null>;
    const body = `<p style="font-size:15px;line-height:1.55">Hola ${esc(o.guest_name)}. ${INTRO[kind]}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">${rows}${totals}</table>
      ${kind === "shipped" && o.tracking ? `<p style="font-size:14px;margin-top:16px"><strong>Seguimiento:</strong> ${esc(o.tracking)}</p>` : ""}
      <p style="font-size:13px;color:#5e5750;margin-top:16px">Entrega: ${esc(`${a.street ?? ""} ${a.number ?? ""}${a.apartment ? `, ${a.apartment}` : ""}, ${a.comuna ?? ""}, ${a.region ?? ""}`)}</p>`;
    await sendMail({
      to: o.guest_email,
      subject: SUBJECT[kind](o.number),
      html: layout(SUBJECT[kind](o.number).replace(" · Allister Eyewear", ""), body, kind === "received" ? { href: link, label: "Pagar y seguir mi pedido" } : { href: link, label: "Ver mi pedido" }),
      idempotencyKey: `pedido-${o.id}-${kind}`,
    });
  } catch (e) {
    console.error("[mail] pedido", orderId, kind, e);
  }
}

/** Aviso interno de venta al negocio. */
export async function sendSaleNoticeMail(orderId: string): Promise<void> {
  const to = process.env.MAIL_NOTIFY;
  if (!mailConfigured() || !to) return;
  try {
    const admin = createAdminClient();
    const { data: o } = await admin.from("orders").select("number, guest_name, guest_email, guest_phone, total_clp, address").eq("id", orderId).maybeSingle();
    if (!o) return;
    const { data: items } = await admin.from("order_items").select("name, sku, variant_label, quantity").eq("order_id", orderId);
    const a = o.address as Record<string, string | null>;
    const list = (items ?? []).map((i) => `<li>${esc(i.name)} (${esc(i.sku)})${i.variant_label ? ` · ${esc(i.variant_label)}` : ""} × ${i.quantity}</li>`).join("");
    await sendMail({
      to,
      subject: `Venta confirmada · Pedido #${o.number} · ${formatCLP(o.total_clp)}`,
      html: layout(`Nuevo pedido pagado #${o.number}`, `<p><strong>${esc(o.guest_name)}</strong> · ${esc(o.guest_email)} · ${esc(o.guest_phone)}</p><ul>${list}</ul><p>${esc(`${a.street ?? ""} ${a.number ?? ""}${a.apartment ? `, ${a.apartment}` : ""}, ${a.comuna ?? ""}, ${a.region ?? ""}`)}</p>`, { href: `${publicEnv.siteUrl}/admin/pedidos/${orderId}`, label: "Abrir en el panel" }),
      idempotencyKey: `venta-${orderId}`,
    });
  } catch (e) {
    console.error("[mail] aviso venta", orderId, e);
  }
}
