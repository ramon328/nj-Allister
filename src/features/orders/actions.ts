"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, assertSuperadmin } from "@/lib/auth/session";
import { clientIp, safeEqualHex } from "@/lib/auth/tokens";
import { flatten, type FormState } from "@/lib/form-state";
import type { OrderRow } from "@/lib/supabase/database.types";
import { adminOrderSchema, guestCheckoutSchema, LEGAL_VERSION, ORDER_TRANSITIONS } from "./schemas";
import { sendOrderMail } from "./mail";

export type GuestCheckoutState = FormState & { orderId?: string; token?: string };

const DB_ERRORS: Array<[RegExp, string]> = [
  [/insufficient stock for (.+)/i, "Sin stock suficiente de $1. Ajusta la cantidad en el carrito."],
  [/product unavailable/i, "Uno de los productos ya no está disponible. Revisa tu carrito."],
  [/price changed/i, "El precio de un producto cambió. Recarga la página y revisa tu carrito."],
  [/pending order limit/i, "Ya tienes 3 pedidos pendientes de pago con este correo. Paga o cancela uno para continuar."],
  [/invalid promo/i, "El código de descuento no es válido o ya venció."],
  [/guest unit limit/i, "Máximo 12 unidades por pedido. Para más, escríbenos por WhatsApp."],
  [/invalid variant/i, "Elige una opción válida del producto."],
];
function humanize(msg: string): string {
  for (const [re, out] of DB_ERRORS) {
    const m = msg.match(re);
    if (m) return out.replace("$1", m[1] ?? "");
  }
  console.error("[checkout] error no mapeado:", msg);
  return "No pudimos crear el pedido. Intenta de nuevo en un momento.";
}

/** Crea el pedido de invitado, descuenta stock y devuelve el token de acceso. */
export async function placeGuestOrder(_prev: GuestCheckoutState, formData: FormData): Promise<GuestCheckoutState> {
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", message: "Carrito inválido." };
  }
  const parsed = guestCheckoutSchema.safeParse({ ...Object.fromEntries(formData), items });
  if (!parsed.success) return { status: "error", fieldErrors: flatten(parsed.error), message: "Revisa los campos marcados." };
  const d = parsed.data;

  const admin = createAdminClient();
  const ip = await clientIp();
  const { data: ok } = await admin.rpc("rate_allow", { p_key: `guest:${ip}`, p_max: 6, p_window_min: 60, p_max_day: 3000 });
  if (ok !== true) return { status: "error", message: "Demasiados intentos desde tu conexión. Espera unos minutos." };

  const { data, error } = await admin.rpc("create_guest_order", {
    p_items: d.items.map((i) => ({ product_id: i.product_id, variant: i.variant ?? null, quantity: i.quantity, unit_price_clp: i.unit_price_clp })),
    p_contact: { name: d.name, email: d.email, phone: d.phone },
    p_address: { street: d.street, number: d.number, apartment: d.apartment, comuna: d.comuna, city: d.city, region: d.region, postal_code: d.postal_code },
    p_request_id: d.request_id,
    p_terms_version: LEGAL_VERSION,
    p_notes: d.notes,
    p_promo_code: d.promo_code,
  });
  if (error) return { status: "error", message: humanize(error.message) };
  const row = data?.[0];
  if (!row) return { status: "error", message: "No pudimos crear el pedido." };
  await sendOrderMail(row.new_order_id, "received");
  return { status: "success", orderId: row.new_order_id, token: row.access_token };
}

/** Valida un código de descuento en vivo (porcentaje o 0). Limitado por IP. */
export async function checkPromo(code: string, subtotal: number): Promise<number> {
  const c = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/).safeParse(code);
  if (!c.success) return 0;
  const admin = createAdminClient();
  const ip = await clientIp();
  const { data: ok } = await admin.rpc("rate_allow", { p_key: `promo:${ip}`, p_max: 30, p_window_min: 10, p_max_day: 5000 });
  if (ok !== true) return 0;
  const { data } = await admin.rpc("promo_pct", { p_code: c.data, p_subtotal: Math.max(0, Math.floor(subtotal)) });
  return data ?? 0;
}

/** El comprador cancela su pedido pendiente (token del enlace). */
export async function cancelGuestOrder(orderId: string, token: string): Promise<{ ok: boolean }> {
  if (!z.string().uuid().safeParse(orderId).success || !/^[a-f0-9]{48}$/.test(token)) return { ok: false };
  const admin = createAdminClient();
  const { data: raw } = await admin.from("orders").select("guest_token").eq("id", orderId).maybeSingle();
  if (!safeEqualHex(raw?.guest_token, token)) return { ok: false };
  const { data } = await admin.rpc("cancel_guest_order", { p_order: orderId, p_token: token });
  if (data === true) await sendOrderMail(orderId, "cancelled");
  revalidatePath(`/pedido/${orderId}`);
  return { ok: data === true };
}

/** Panel: cambio de estado, notas, envío y seguimiento. */
export async function adminUpdateOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await assertAdmin();
  const parsed = adminOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: flatten(parsed.error), message: "Revisa los campos." };
  const d = parsed.data;
  const supabase = await createClient();
  const { data: current } = await supabase.from("orders").select("status, admin_notes").eq("id", d.id).maybeSingle();
  if (!current) return { status: "error", message: "Pedido no encontrado." };
  const changing = d.status !== current.status;
  if (changing && !ORDER_TRANSITIONS[current.status].includes(d.status)) return { status: "error", message: `No se puede pasar de ${current.status} a ${d.status}.` };
  if (changing && d.status === "paid") {
    // Marcar pagado a mano: solo superadmin y con una nota que lo justifique.
    if (me.role !== "superadmin") return { status: "error", message: "Solo un superadmin puede marcar un pedido como pagado a mano." };
    if (!d.admin_notes || d.admin_notes.length < 8) return { status: "error", message: "Escribe una nota indicando cómo se verificó el pago." };
  }
  const update: Partial<OrderRow> = { status: d.status, admin_notes: d.admin_notes, tracking: d.tracking };
  if (d.shipping_clp !== undefined && current.status === "pending") update.shipping_clp = d.shipping_clp;
  const { error } = await supabase.from("orders").update(update).eq("id", d.id);
  if (error) return { status: "error", message: error.message.includes("shipping locked") ? "El envío no se puede cambiar después del pago." : error.message };
  if (changing && (d.status === "shipped" || d.status === "cancelled")) await sendOrderMail(d.id, d.status);
  revalidatePath(`/admin/pedidos/${d.id}`);
  revalidatePath("/admin/pedidos");
  return { status: "success", message: "Pedido actualizado." };
}

/** Panel: reembolso en Mercado Pago (total o parcial). Solo superadmin. */
export async function refundOrderPayment(orderId: string, amount?: number): Promise<FormState> {
  const me = await assertSuperadmin();
  if (!z.string().uuid().safeParse(orderId).success) return { status: "error", message: "Pedido inválido." };
  const { mpRefund } = await import("@/lib/payments/mercadopago");
  const admin = createAdminClient();
  const { data: o } = await admin.from("orders").select("payment_id, total_clp, number").eq("id", orderId).maybeSingle();
  if (!o?.payment_id) return { status: "error", message: "El pedido no tiene un pago de Mercado Pago." };
  const r = await mpRefund(o.payment_id, amount && amount < o.total_clp ? amount : undefined, `refund-${orderId}-${amount ?? "total"}`);
  await admin.from("order_events").insert({ order_id: orderId, from_status: null, to_status: "cancelled", actor_id: me.id, internal: true, note: r.ok ? `Reembolso MP ${r.refundId ?? ""} por ${amount ?? "el total"}` : `Reembolso MP falló: ${r.message}` });
  revalidatePath(`/admin/pedidos/${orderId}`);
  return r.ok ? { status: "success", message: "Reembolso solicitado a Mercado Pago." } : { status: "error", message: r.message ?? "Mercado Pago rechazó el reembolso." };
}
