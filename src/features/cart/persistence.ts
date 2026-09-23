import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,95}$/),
  name: z.string().min(1).max(200),
  sku: z.string().max(40),
  colorLabel: z.string().max(100).nullable().optional(),
  variant: z.string().max(60).nullable().optional(),
  price: z.number().int().min(0).max(2_147_483_647),
  comparePrice: z.number().int().positive().max(2_147_483_647).nullable().optional(),
  image: z.string().min(1).refine((u) => u.startsWith("https://") || u.startsWith("/")).nullable(),
  quantity: z.number().int().min(1).max(20),
});
export type CartItem = z.infer<typeof cartItemSchema>;
export type CartState = { items: CartItem[] };

export const lineKey = (i: Pick<CartItem, "productId" | "variant">) => `${i.productId}::${i.variant ?? ""}`;

/** Hidratación validada: ante datos corruptos o duplicados se parte de cero. */
export function parseCart(raw: string | null): CartState {
  try {
    const parsed = z.object({ items: z.array(cartItemSchema).max(20) }).safeParse(JSON.parse(raw ?? "{}"));
    if (!parsed.success || new Set(parsed.data.items.map(lineKey)).size !== parsed.data.items.length) return { items: [] };
    return parsed.data;
  } catch {
    return { items: [] };
  }
}
