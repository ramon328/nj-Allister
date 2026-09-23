// Tipos espejo de supabase/migrations/*.sql. Mantener a mano al cambiar el esquema.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "customer" | "admin" | "superadmin";
export type OrderStatus = "pending" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled";
export type ProductKind = "sol" | "optico" | "lectura";

type Timestamps = { created_at: string; updated_at: string };

export type ProfileRow = Timestamps & {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  disabled: boolean;
};

export type ShopSettingsRow = {
  id: number;
  shipping_clp: number;
  free_shipping_min_clp: number;
  whatsapp: string | null;
  announcement: string[];
  updated_at: string;
};

export type CollectionRow = Timestamps & {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  badge: string | null;
  sort: number;
  active: boolean;
};
export type CollectionView = CollectionRow & { product_count: number };

export type ProductVariant = { title: string; sku?: string | null; available?: boolean };

export type ProductRow = Timestamps & {
  id: string;
  sku: string;
  slug: string;
  name: string;
  model_code: string | null;
  color_label: string | null;
  color_hex: string | null;
  kind: ProductKind;
  description: string | null;
  features: string[];
  price_clp: number;
  compare_price_clp: number | null;
  image_url: string | null;
  gallery_images: string[];
  variants: ProductVariant[];
  stock: number;
  active: boolean;
  featured: boolean;
  tags: string[];
  shopify_id: number | null;
};

export type PromoCodeRow = {
  code: string;
  discount_pct: number;
  min_subtotal_clp: number;
  max_uses: number | null;
  uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type OrderAddress = {
  street: string;
  number: string;
  apartment: string | null;
  comuna: string;
  city: string;
  region: string;
  postal_code: string | null;
};

export type OrderRow = Timestamps & {
  id: string;
  number: number;
  user_id: string | null;
  status: OrderStatus;
  subtotal_clp: number;
  discount_clp: number;
  shipping_clp: number;
  total_clp: number;
  promo_code: string | null;
  address: OrderAddress;
  notes: string | null;
  admin_notes: string | null;
  guest_email: string;
  guest_name: string;
  guest_phone: string;
  guest_token: string;
  checkout_key: string;
  terms_version: string | null;
  payment_method: "mercadopago" | null;
  payment_id: string | null;
  payment_url: string | null;
  payment_amount_clp: number | null;
  payment_state: "processing" | null;
  paid_at: string | null;
  tracking: string | null;
  reminder_sent_at: string | null;
};
export type OrderView = OrderRow & { item_count: number; units: number };

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  sku: string;
  variant_label: string | null;
  unit_price_clp: number;
  quantity: number;
  image_url: string | null;
};

export type OrderEventRow = {
  id: number;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_id: string | null;
  note: string | null;
  internal: boolean;
  created_at: string;
};

export type SearchHit = {
  kind: "product" | "collection";
  id: string;
  slug: string;
  name: string;
  sub: string | null;
  image_url: string | null;
  price_clp: number | null;
  rank: number;
};

type Tbl<R, I = Partial<R>, U = Partial<R>> = { Row: R; Insert: I; Update: U; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Tbl<ProfileRow>;
      shop_settings: Tbl<ShopSettingsRow>;
      collections: Tbl<CollectionRow>;
      products: Tbl<ProductRow>;
      product_collections: Tbl<{ product_id: string; collection_id: string }>;
      promo_codes: Tbl<PromoCodeRow>;
      orders: Tbl<OrderRow>;
      order_items: Tbl<OrderItemRow>;
      order_events: Tbl<OrderEventRow>;
      rate_limits: Tbl<{ bucket: string; hits: number; window_start: string }>;
    };
    Views: {
      collections_view: { Row: CollectionView; Relationships: [] };
      orders_view: { Row: OrderView; Relationships: [] };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_superadmin: { Args: Record<string, never>; Returns: boolean };
      set_product_collections: { Args: { p_product: string; p_collections: string[] }; Returns: undefined };
      promo_pct: { Args: { p_code: string; p_subtotal: number }; Returns: number };
      rate_allow: { Args: { p_key: string; p_max?: number; p_window_min?: number; p_max_day?: number }; Returns: boolean };
      rate_limits_cleanup: { Args: Record<string, never>; Returns: undefined };
      create_guest_order: {
        Args: { p_items: Json; p_contact: Json; p_address: Json; p_request_id: string; p_terms_version: string; p_notes?: string | null; p_promo_code?: string | null };
        Returns: { new_order_id: string; access_token: string }[];
      };
      cancel_guest_order: { Args: { p_order: string; p_token: string }; Returns: boolean };
      expire_pending_orders: { Args: { p_hours?: number }; Returns: string[] };
      search_catalog: { Args: { p_q: string; p_limit?: number }; Returns: SearchHit[] };
    };
    Enums: { app_role: AppRole; order_status: OrderStatus; product_kind: ProductKind };
    CompositeTypes: Record<string, never>;
  };
};
