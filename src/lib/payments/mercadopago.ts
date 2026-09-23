import "server-only";

// Mercado Pago Checkout Pro: tarjeta de crédito/débito, cuotas, saldo en cuenta.
// Sin SDK: llamadas directas a https://api.mercadopago.com con el access token.
// Docs: https://www.mercadopago.cl/developers/es/reference

const API = "https://api.mercadopago.com";

const token = () => {
  const k = process.env.MP_ACCESS_TOKEN;
  if (!k) throw new Error("MP_ACCESS_TOKEN no configurada");
  return k;
};

export const mpConfigured = () => Boolean(process.env.MP_ACCESS_TOKEN);

function conEstado(url: string, estado: string): string {
  const u = new URL(url);
  u.searchParams.set("estado", estado);
  return u.toString();
}

export type MPPreferenceResult = { preferenceId: string; initPoint: string };

/** Crea una preferencia de Checkout Pro y devuelve la URL de pago (init_point). */
export async function createMPPreference(opts: {
  orderId: string;
  orderNumber: number;
  items: Array<{ title: string; quantity: number; unit_price: number; picture_url?: string | null }>;
  shipping: number;
  email: string;
  returnUrl: string;
  webhookUrl: string;
}): Promise<MPPreferenceResult> {
  const items = opts.items.map((i) => ({
    title: i.title.slice(0, 250),
    quantity: i.quantity,
    unit_price: i.unit_price,
    currency_id: "CLP",
    ...(i.picture_url ? { picture_url: i.picture_url } : {}),
  }));
  if (opts.shipping > 0) items.push({ title: "Despacho", quantity: 1, unit_price: opts.shipping, currency_id: "CLP" });
  const body = {
    items,
    payer: { email: opts.email },
    external_reference: opts.orderId,
    back_urls: {
      success: conEstado(opts.returnUrl, "ok"),
      failure: conEstado(opts.returnUrl, "error"),
      pending: conEstado(opts.returnUrl, "pendiente"),
    },
    // MP solo acepta auto_return con back_urls https; en localhost responde 400.
    ...(opts.returnUrl.startsWith("https://") ? { auto_return: "approved" } : {}),
    notification_url: opts.webhookUrl,
    statement_descriptor: "ALLISTER",
    metadata: { order_id: opts.orderId, order_number: opts.orderNumber },
  };
  const res = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", "X-Idempotency-Key": `${opts.orderId}-${opts.shipping}-${items.length}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[mp] create preference failed", res.status, text);
    throw new Error(`MercadoPago: ${res.status}`);
  }
  const data = (await res.json()) as { id: string; init_point: string };
  return { preferenceId: data.id, initPoint: data.init_point };
}

export type MPPaymentInfo = {
  id: number;
  status: string; // approved | pending | in_process | authorized | rejected | cancelled | refunded | charged_back
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  date_created: string;
  date_approved: string | null;
  payment_method_id?: string;
  payment_type_id?: string;
  installments?: number;
  payer?: { email?: string | null };
  transaction_details?: { net_received_amount?: number; total_paid_amount?: number };
  fee_details?: { type: string; amount: number }[];
  card?: { last_four_digits?: string | null } | null;
};

async function mpGet<T>(path: string): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store", signal: AbortSignal.timeout(12_000) });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error("[mp]", path, e);
    return { ok: false, status: 0, data: null };
  }
}

/** Consulta el estado de un pago en Mercado Pago (fuente de verdad del webhook). */
export async function getMPPayment(paymentId: string): Promise<MPPaymentInfo> {
  const { ok, status, data } = await mpGet<MPPaymentInfo>(`/v1/payments/${paymentId}`);
  if (!ok || !data) throw new Error(`MP getPayment: ${status}`);
  return data;
}

export type MPAccount = { id: number; nickname: string; email: string; site_id: string };
export async function mpAccount(): Promise<MPAccount | null> {
  const { ok, data } = await mpGet<MPAccount>("/users/me");
  return ok ? data : null;
}

export async function mpSearchPayments(opts: { limit?: number; status?: string; days?: number } = {}): Promise<{ results: MPPaymentInfo[]; total: number } | null> {
  const p = new URLSearchParams({ sort: "date_created", criteria: "desc", limit: String(opts.limit ?? 50), offset: "0" });
  if (opts.status) p.set("status", opts.status);
  if (opts.days) { p.set("range", "date_created"); p.set("begin_date", `NOW-${opts.days}DAYS`); p.set("end_date", "NOW"); }
  const { ok, data } = await mpGet<{ results: MPPaymentInfo[]; paging: { total: number } }>(`/v1/payments/search?${p}`);
  return ok && data ? { results: data.results, total: data.paging.total } : null;
}

/** Pago más relevante de un pedido: aprobado > en proceso > último intento. */
export async function mpFindPayment(orderId: string): Promise<MPPaymentInfo | null> {
  const p = new URLSearchParams({ external_reference: orderId, sort: "date_created", criteria: "desc", limit: "10" });
  const { ok, data } = await mpGet<{ results: MPPaymentInfo[] }>(`/v1/payments/search?${p}`);
  if (!ok || !data || data.results.length === 0) return null;
  const r = data.results;
  return r.find((x) => x.status === "approved") ?? r.find((x) => ["in_process", "pending", "authorized"].includes(x.status)) ?? r[0];
}

/** Reembolso total (sin monto) o parcial. Idempotente por clave. */
export async function mpRefund(paymentId: string, amount?: number, idempotencyKey?: string): Promise<{ ok: boolean; message?: string; refundId?: number }> {
  try {
    const res = await fetch(`${API}/v1/payments/${paymentId}/refunds`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey ?? `${paymentId}-${Date.now()}` },
      body: JSON.stringify(amount ? { amount } : {}),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => null)) as { id?: number; message?: string } | null;
    if (!res.ok) return { ok: false, message: data?.message ?? `MP ${res.status}` };
    return { ok: true, refundId: data?.id };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "error" };
  }
}
