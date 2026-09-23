import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderEventRow, OrderItemRow, OrderStatus, OrderView } from "@/lib/supabase/database.types";

export const ORDER_COLS = "id, number, user_id, status, subtotal_clp, discount_clp, shipping_clp, total_clp, promo_code, address, notes, admin_notes, guest_email, guest_name, guest_phone, guest_token, checkout_key, terms_version, payment_method, payment_id, payment_url, payment_amount_clp, payment_state, paid_at, tracking, reminder_sent_at, created_at, updated_at, item_count, units" as const;
const ITEM_COLS = "id, order_id, product_id, name, sku, variant_label, unit_price_clp, quantity, image_url" as const;
const EVENT_COLS = "id, order_id, from_status, to_status, actor_id, note, internal, created_at" as const;

export type OrderDetail = { order: OrderView; items: OrderItemRow[]; events: OrderEventRow[] };

/* Admin: con sesión (RLS) */
export async function listOrders(status?: OrderStatus, q?: string): Promise<OrderView[]> {
  const supabase = await createClient();
  let query = supabase.from("orders_view").select(ORDER_COLS).order("created_at", { ascending: false }).limit(300);
  if (status) query = query.eq("status", status);
  if (q) {
    const clean = q.replace(/[%,()]/g, "");
    query = /^\d+$/.test(clean) ? query.eq("number", Number(clean)) : query.or(`guest_email.ilike.%${clean}%,guest_name.ilike.%${clean}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getOrderAdmin(id: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders_view").select(ORDER_COLS).eq("id", id).maybeSingle();
  if (!order) return null;
  const [{ data: items }, { data: events }] = await Promise.all([
    supabase.from("order_items").select(ITEM_COLS).eq("order_id", id),
    supabase.from("order_events").select(EVENT_COLS).eq("order_id", id).order("created_at", { ascending: false }),
  ]);
  return { order, items: items ?? [], events: events ?? [] };
}

export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const supabase = await createClient();
  const counts: Record<OrderStatus, number> = { pending: 0, paid: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  await Promise.all(
    (Object.keys(counts) as OrderStatus[]).map(async (s) => {
      const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", s);
      counts[s] = count ?? 0;
    }),
  );
  return counts;
}

export async function salesSummary(days = 30): Promise<{ orders: number; revenue: number }> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await supabase.from("orders").select("total_clp").in("status", ["paid", "preparing", "shipped", "delivered"]).gte("paid_at", since);
  return { orders: data?.length ?? 0, revenue: (data ?? []).reduce((n, o) => n + o.total_clp, 0) };
}

/* Invitado: service role (el dueño ya se validó con el token). */
export async function getOrderGuest(id: string): Promise<OrderDetail | null> {
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders_view").select(ORDER_COLS).eq("id", id).maybeSingle();
  if (!order) return null;
  const [{ data: items }, { data: events }] = await Promise.all([
    admin.from("order_items").select(ITEM_COLS).eq("order_id", id),
    admin.from("order_events").select(EVENT_COLS).eq("order_id", id).eq("internal", false).order("created_at", { ascending: false }),
  ]);
  return { order, items: items ?? [], events: events ?? [] };
}
