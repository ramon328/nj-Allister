import { z } from "zod";
import { buscarComuna, validarCodigoPostal } from "@/lib/postal";
import type { OrderStatus } from "@/lib/supabase/database.types";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"];
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
export const ORDER_STATUS_LABEL: Record<OrderStatus, { label: string; tone: "neutral" | "ok" | "warn" | "bad" | "info" }> = {
  pending: { label: "Pendiente de pago", tone: "warn" },
  paid: { label: "Pagado", tone: "info" },
  preparing: { label: "Preparando", tone: "info" },
  shipped: { label: "Enviado", tone: "ok" },
  delivered: { label: "Entregado", tone: "ok" },
  cancelled: { label: "Cancelado", tone: "bad" },
};

export const LEGAL_VERSION = "2026-09-23";

const promoCode = z.string().trim().toUpperCase().max(20).optional().transform((v) => (v ? v : null)).refine((v) => v === null || /^[A-Z0-9]{3,20}$/.test(v), "Código inválido");
const phone = z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/, "Teléfono inválido");

export const itemsSchema = z
  .array(z.object({ product_id: z.string().uuid(), variant: z.string().max(60).nullable().optional(), quantity: z.number().int().min(1).max(20), unit_price_clp: z.number().int().nonnegative() }))
  .min(1, "El carrito está vacío")
  .max(20)
  .refine((items) => new Set(items.map((i) => `${i.product_id}::${i.variant ?? ""}`)).size === items.length, "Productos duplicados");

export function validarComunaYPostal(d: { comuna: string; postal_code: string | null }, ctx: z.RefinementCtx) {
  const r = validarCodigoPostal(d.postal_code, d.comuna);
  if (r.ok) return;
  ctx.addIssue({ code: "custom", path: [r.comuna ? "postal_code" : "comuna"], message: r.motivo });
}
export function canonizarComuna<T extends { comuna: string; region: string }>(d: T): T {
  const c = buscarComuna(d.comuna);
  return c ? { ...d, comuna: c.comuna, region: c.region } : d;
}

/** Compra sin registro: contacto + dirección en un solo paso. */
export const guestCheckoutSchema = z
  .object({
    request_id: z.string().uuid(),
    name: z.string().trim().min(2, "Tu nombre").max(80),
    email: z.string().trim().toLowerCase().email("Correo inválido").max(120),
    phone,
    street: z.string().trim().min(2, "Calle").max(120),
    number: z.string().trim().min(1, "Número").max(20),
    apartment: z.string().trim().max(40).optional().transform((v) => (v ? v : null)),
    comuna: z.string().trim().min(2, "Comuna").max(60),
    city: z.string().trim().min(2, "Ciudad").max(60),
    region: z.string().trim().min(2, "Región").max(60),
    postal_code: z.string().trim().optional().transform((v) => (v ? v.replace(/\D/g, "") : null)).refine((v) => v === null || /^\d{7}$/.test(v), "Código postal de 7 dígitos"),
    notes: z.string().trim().max(300).optional().transform((v) => (v ? v : null)),
    promo_code: promoCode,
    terms: z.literal("on", { message: "Debes aceptar los términos" }),
    items: itemsSchema,
  })
  .superRefine(validarComunaYPostal)
  .transform(canonizarComuna);

export const adminOrderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ORDER_STATUSES as [OrderStatus, ...OrderStatus[]]),
  admin_notes: z.string().trim().max(500).optional().transform((v) => (v ? v : null)),
  shipping_clp: z.coerce.number().int().min(0).max(999_999).optional(),
  tracking: z.string().trim().max(120).optional().transform((v) => (v ? v : null)),
});
