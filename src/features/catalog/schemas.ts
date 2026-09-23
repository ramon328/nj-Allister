import { z } from "zod";

const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const httpsOrLocal = (v: string) => /^https:\/\/.+/.test(v) || /^\/assets\/.+/.test(v);

export const productSchema = z.object({
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._-]{0,39}$/, "SKU: letras, números, punto o guion"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,95}$/, "Slug: minúsculas, números y guiones"),
  name: z.string().trim().min(1, "Nombre").max(160),
  model_code: optional(32).transform((v) => (v ? v.toUpperCase().replace(/[^A-Z0-9]/g, "") : null)),
  color_label: optional(60),
  color_hex: z.string().trim().optional().transform((v) => (v && v !== "#000000" ? v : null)).refine((v) => v === null || /^#[0-9a-fA-F]{6}$/.test(v), "Color hex"),
  kind: z.enum(["sol", "optico", "lectura"]),
  description: optional(4000),
  features: z.string().optional().transform((v) => (v ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12)),
  price_clp: z.coerce.number().int().min(0).max(9_999_999),
  compare_price_clp: z.coerce.number().int().min(0).max(9_999_999).optional().transform((v) => (v ? v : null)),
  image_url: optional(600).refine((v) => v === null || httpsOrLocal(v), "URL https"),
  gallery_images: z.string().optional().transform((v) => (v ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 40)).refine((a) => a.every(httpsOrLocal), "Solo URLs https"),
  stock: z.coerce.number().int().min(0).max(99_999),
  active: z.string().optional().transform((v) => v === "on"),
  featured: z.string().optional().transform((v) => v === "on"),
  tags: z.string().optional().transform((v) => (v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 20)),
  collections: z.array(z.string().uuid()).optional().default([]),
}).refine((d) => !d.compare_price_clp || d.compare_price_clp > d.price_clp, { path: ["compare_price_clp"], message: "Debe ser mayor al precio" });

export type ProductInput = z.infer<typeof productSchema>;

export const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,63}$/, "Slug inválido"),
  name: z.string().trim().min(1).max(80),
  tagline: optional(120),
  description: optional(600),
  image_url: optional(600).refine((v) => v === null || httpsOrLocal(v), "URL https"),
  badge: optional(30),
  sort: z.coerce.number().int().min(0).max(999).default(0),
  active: z.string().optional().transform((v) => v === "on"),
});

export const settingsSchema = z.object({
  shipping_clp: z.coerce.number().int().min(0).max(999_999),
  free_shipping_min_clp: z.coerce.number().int().min(0).max(9_999_999),
  whatsapp: optional(20),
  announcement: z.string().optional().transform((v) => (v ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6)),
});

export const promoSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "3 a 20 letras o números"),
  discount_pct: z.coerce.number().int().min(1).max(90),
  min_subtotal_clp: z.coerce.number().int().min(0).default(0),
  max_uses: z.coerce.number().int().min(1).optional().transform((v) => (v ? v : null)),
  expires_at: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : null)),
  active: z.string().optional().transform((v) => v === "on"),
});
