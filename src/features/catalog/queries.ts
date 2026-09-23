import "server-only";
import { cache } from "react";
import { createPublicClient, createClient } from "@/lib/supabase/server";
import type { CollectionView, ProductRow, ShopSettingsRow } from "@/lib/supabase/database.types";

export const PRODUCT_COLS = "id, sku, slug, name, model_code, color_label, color_hex, kind, description, features, price_clp, compare_price_clp, image_url, gallery_images, variants, stock, active, featured, tags, shopify_id, created_at, updated_at" as const;

export type ProductCard = Pick<ProductRow, "id" | "sku" | "slug" | "name" | "model_code" | "color_label" | "color_hex" | "kind" | "price_clp" | "compare_price_clp" | "image_url" | "gallery_images" | "variants" | "stock" | "featured" | "tags">;
const CARD_COLS = "id, sku, slug, name, model_code, color_label, color_hex, kind, price_clp, compare_price_clp, image_url, gallery_images, variants, stock, featured, tags" as const;

export const getSettings = cache(async (): Promise<ShopSettingsRow> => {
  const { data } = await createPublicClient().from("shop_settings").select("*").eq("id", 1).maybeSingle();
  return data ?? { id: 1, shipping_clp: 3990, free_shipping_min_clp: 39900, whatsapp: null, announcement: [], updated_at: "" };
});

export const listCollections = cache(async (): Promise<CollectionView[]> => {
  const { data } = await createPublicClient().from("collections_view").select("*").eq("active", true).order("sort");
  return data ?? [];
});

export async function getCollection(slug: string): Promise<CollectionView | null> {
  const { data } = await createPublicClient().from("collections_view").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export type CatalogFilters = {
  q?: string;
  collection?: string;
  kind?: string;
  min?: number;
  max?: number;
  sort?: "nuevo" | "precio-asc" | "precio-desc" | "oferta";
  page?: number;
};
export const PAGE_SIZE = 24;

export async function listProducts(f: CatalogFilters): Promise<{ items: ProductCard[]; total: number }> {
  const supabase = createPublicClient();
  let ids: string[] | null = null;
  if (f.collection) {
    const { data: col } = await supabase.from("collections").select("id").eq("slug", f.collection).maybeSingle();
    if (!col) return { items: [], total: 0 };
    const { data: rows } = await supabase.from("product_collections").select("product_id").eq("collection_id", col.id);
    ids = (rows ?? []).map((r) => r.product_id);
    if (ids.length === 0) return { items: [], total: 0 };
  }
  let q = supabase.from("products").select(CARD_COLS, { count: "exact" }).eq("active", true);
  if (ids) q = q.in("id", ids);
  if (f.kind && ["sol", "optico", "lectura"].includes(f.kind)) q = q.eq("kind", f.kind as ProductRow["kind"]);
  if (f.q) q = q.or(`name.ilike.%${f.q.replace(/[%,()]/g, "")}%,sku.ilike.%${f.q.replace(/[%,()]/g, "")}%`);
  if (f.min) q = q.gte("price_clp", f.min);
  if (f.max) q = q.lte("price_clp", f.max);
  if (f.sort === "precio-asc") q = q.order("price_clp", { ascending: true });
  else if (f.sort === "precio-desc") q = q.order("price_clp", { ascending: false });
  else if (f.sort === "oferta") q = q.order("compare_price_clp", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  else q = q.order("stock", { ascending: false }).order("featured", { ascending: false }).order("created_at", { ascending: false });
  const page = Math.max(1, f.page ?? 1);
  q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count } = await q;
  return { items: data ?? [], total: count ?? 0 };
}

export const featuredProducts = cache(async (limit = 8): Promise<ProductCard[]> => {
  const { data } = await createPublicClient().from("products").select(CARD_COLS).eq("active", true).gt("stock", 0).eq("featured", true).limit(limit);
  if (data && data.length >= 4) return data;
  const { data: fallback } = await createPublicClient().from("products").select(CARD_COLS).eq("active", true).gt("stock", 0).eq("kind", "sol").order("created_at", { ascending: false }).limit(limit);
  return fallback ?? [];
});

export async function getProduct(slug: string): Promise<ProductRow | null> {
  const { data } = await createPublicClient().from("products").select(PRODUCT_COLS).eq("slug", slug).eq("active", true).maybeSingle();
  return data;
}

/** Otros colores del mismo modelo (mismo model_code), para el selector. */
export async function siblingProducts(p: Pick<ProductRow, "id" | "model_code">): Promise<ProductCard[]> {
  if (!p.model_code) return [];
  const { data } = await createPublicClient().from("products").select(CARD_COLS).eq("active", true).eq("model_code", p.model_code).neq("id", p.id).order("name").limit(12);
  return data ?? [];
}

export async function relatedProducts(p: Pick<ProductRow, "id" | "kind" | "model_code">, limit = 4): Promise<ProductCard[]> {
  let q = createPublicClient().from("products").select(CARD_COLS).eq("active", true).gt("stock", 0).eq("kind", p.kind).neq("id", p.id);
  if (p.model_code) q = q.neq("model_code", p.model_code);
  const { data } = await q.order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function productCollections(productId: string): Promise<string[]> {
  const { data } = await createPublicClient().from("product_collections").select("collection_id").eq("product_id", productId);
  return (data ?? []).map((r) => r.collection_id);
}

/* ----- Admin (con sesión, respeta RLS) ----- */
export async function adminListProducts(opts: { q?: string; kind?: string; inactive?: boolean } = {}): Promise<ProductRow[]> {
  const supabase = await createClient();
  let q = supabase.from("products").select(PRODUCT_COLS).order("updated_at", { ascending: false }).limit(500);
  if (opts.q) q = q.or(`name.ilike.%${opts.q.replace(/[%,()]/g, "")}%,sku.ilike.%${opts.q.replace(/[%,()]/g, "")}%`);
  if (opts.kind) q = q.eq("kind", opts.kind as ProductRow["kind"]);
  if (!opts.inactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export async function adminGetProduct(id: string): Promise<ProductRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_COLS).eq("id", id).maybeSingle();
  return data;
}

export async function adminListCollections(): Promise<CollectionView[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("collections_view").select("*").order("sort");
  return data ?? [];
}
