-- 0001: Allister Eyewear — roles, catálogo, carrito/pedidos, pagos, límites.
-- Seguridad: RLS en todas las tablas (default deny), políticas por comando,
-- funciones privilegiadas sin EXECUTE para anon/authenticated (solo service_role).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------- enums ----------
do $$ begin
  create type public.app_role as enum ('customer', 'admin', 'superadmin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_kind as enum ('sol', 'optico', 'lectura');
exception when duplicate_object then null; end $$;

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- perfiles y roles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'customer',
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_email_key on public.profiles (lower(email));
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- Correos que reciben superadmin automáticamente al crearse en Auth.
create table if not exists public.bootstrap_superadmins (
  email text primary key,
  created_at timestamptz not null default now()
);
insert into public.bootstrap_superadmins (email) values ('ramon@dropout.cl'), ('contacto@allister-eyewear.com') on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role public.app_role := 'customer';
begin
  if exists (select 1 from public.bootstrap_superadmins b where lower(b.email) = lower(new.email)) then v_role := 'superadmin'; end if;
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), v_role)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and disabled = false
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('admin', 'superadmin'), false)
$$;
create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() = 'superadmin', false)
$$;
revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated, anon;
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.is_superadmin() to authenticated, anon;

-- Solo superadmin cambia role/disabled. Nunca se queda sin superadmin.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_service boolean := coalesce(auth.role() = 'service_role', false);
begin
  if new.role is distinct from old.role or new.disabled is distinct from old.disabled then
    if not (public.is_superadmin() or v_service) then
      raise exception 'only superadmin can change role or disabled' using errcode = '42501';
    end if;
    if old.role = 'superadmin' and not old.disabled and (new.role <> 'superadmin' or new.disabled)
       and (select count(*) from public.profiles where role = 'superadmin' and not disabled and id <> old.id) = 0 then
      raise exception 'cannot remove the last superadmin' using errcode = '42501';
    end if;
  end if;
  new.email := old.email;
  return new;
end $$;
drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges before update on public.profiles for each row execute function public.guard_profile_privileges();

alter table public.profiles enable row level security;
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "profiles: update own or superadmin" on public.profiles;
create policy "profiles: update own or superadmin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_superadmin())) with check (id = (select auth.uid()) or (select public.is_superadmin()));
revoke update on public.profiles from authenticated;
grant update (full_name, role, disabled) on public.profiles to authenticated;

alter table public.bootstrap_superadmins enable row level security;
drop policy if exists "bootstrap: superadmin read" on public.bootstrap_superadmins;
create policy "bootstrap: superadmin read" on public.bootstrap_superadmins for select to authenticated using ((select public.is_superadmin()));

-- ---------- configuración de la tienda ----------
create table if not exists public.shop_settings (
  id smallint primary key default 1 check (id = 1),
  shipping_clp integer not null default 3990 check (shipping_clp >= 0),
  free_shipping_min_clp integer not null default 39900 check (free_shipping_min_clp >= 0),
  whatsapp text,
  announcement text[] not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.shop_settings (id, whatsapp, announcement) values (1, '56978792683', array[
  'Envío gratis por compras sobre $39.900',
  '2x1 en anteojos de lectura magnéticos',
  '40% OFF Colección Generación-A',
  '20% dcto en Filtro Azul, automático en el carro'
]) on conflict (id) do nothing;
drop trigger if exists shop_settings_set_updated_at on public.shop_settings;
create trigger shop_settings_set_updated_at before update on public.shop_settings for each row execute function public.set_updated_at();
alter table public.shop_settings enable row level security;
drop policy if exists "settings: public read" on public.shop_settings;
create policy "settings: public read" on public.shop_settings for select using (true);
drop policy if exists "settings: admin update" on public.shop_settings;
create policy "settings: admin update" on public.shop_settings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- colecciones ----------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  name text not null check (length(name) between 1 and 80),
  tagline text,
  description text,
  image_url text,
  badge text,
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at before update on public.collections for each row execute function public.set_updated_at();
alter table public.collections enable row level security;
drop policy if exists "collections: public read active" on public.collections;
create policy "collections: public read active" on public.collections for select using (active or (select public.is_admin()));
drop policy if exists "collections: admin write" on public.collections;
create policy "collections: admin write" on public.collections for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- productos ----------
-- Cada color es un producto (SKU/stock propio); model_code agrupa los colores de un modelo.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (sku ~ '^[A-Z0-9][A-Z0-9._-]{0,39}$'),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,95}$'),
  name text not null check (length(name) between 1 and 160),
  model_code text,
  color_label text,
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9a-fA-F]{6}$'),
  kind public.product_kind not null default 'sol',
  description text,
  features text[] not null default '{}',
  price_clp integer not null check (price_clp >= 0),
  compare_price_clp integer check (compare_price_clp is null or compare_price_clp > price_clp),
  image_url text,
  gallery_images text[] not null default '{}' check (cardinality(gallery_images) <= 40),
  variants jsonb not null default '[]'::jsonb,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  featured boolean not null default false,
  tags text[] not null default '{}',
  shopify_id bigint unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_active_idx on public.products (active) where active;
create index if not exists products_kind_idx on public.products (kind);
create index if not exists products_model_idx on public.products (model_code) where model_code is not null;
create index if not exists products_name_trgm on public.products using gin (lower(name) extensions.gin_trgm_ops);
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
alter table public.products enable row level security;
drop policy if exists "products: public read active" on public.products;
create policy "products: public read active" on public.products for select using (active or (select public.is_admin()));
drop policy if exists "products: admin insert" on public.products;
create policy "products: admin insert" on public.products for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "products: admin update" on public.products;
create policy "products: admin update" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "products: superadmin delete" on public.products;
create policy "products: superadmin delete" on public.products for delete to authenticated using ((select public.is_superadmin()));

create table if not exists public.product_collections (
  product_id uuid not null references public.products(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  primary key (product_id, collection_id)
);
create index if not exists product_collections_collection_idx on public.product_collections (collection_id);
alter table public.product_collections enable row level security;
drop policy if exists "pc: public read" on public.product_collections;
create policy "pc: public read" on public.product_collections for select using (true);
drop policy if exists "pc: admin write" on public.product_collections;
create policy "pc: admin write" on public.product_collections for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.set_product_collections(p_product uuid, p_collections uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from public.product_collections where product_id = p_product and not (collection_id = any(coalesce(p_collections, '{}')));
  insert into public.product_collections (product_id, collection_id)
  select p_product, c from unnest(coalesce(p_collections, '{}')) c on conflict do nothing;
end $$;
revoke all on function public.set_product_collections(uuid, uuid[]) from public, anon;
grant execute on function public.set_product_collections(uuid, uuid[]) to authenticated;

-- Vista pública con conteo por colección.
create or replace view public.collections_view with (security_invoker = true) as
select c.*, (select count(*) from public.product_collections pc join public.products p on p.id = pc.product_id where pc.collection_id = c.id and p.active) as product_count
from public.collections c;

-- ---------- códigos de descuento ----------
create table if not exists public.promo_codes (
  code text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  discount_pct integer not null check (discount_pct between 1 and 90),
  min_subtotal_clp integer not null default 0 check (min_subtotal_clp >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
insert into public.promo_codes (code, discount_pct) values ('HOLA10', 10) on conflict do nothing;
alter table public.promo_codes enable row level security;
drop policy if exists "promo: admin all" on public.promo_codes;
create policy "promo: admin all" on public.promo_codes for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.promo_pct(p_code text, p_subtotal integer)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((
    select discount_pct from public.promo_codes
    where code = upper(trim(p_code)) and active and (expires_at is null or expires_at > now())
      and (max_uses is null or uses < max_uses) and p_subtotal >= min_subtotal_clp
    limit 1), 0)
$$;
revoke all on function public.promo_pct(text, integer) from public, anon, authenticated;

-- ---------- límites por IP (checkout, seguimiento, webhook) ----------
create table if not exists public.rate_limits (
  bucket text primary key,
  hits integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from public, anon, authenticated;

-- Por IP en una ventana + tope diario por uso (prefijo antes de ':').
create or replace function public.rate_allow(p_key text, p_max integer default 10, p_window_min integer default 10, p_max_day integer default 5000)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_uso text := coalesce(nullif(split_part(coalesce(p_key, 'local'), ':', 1), ''), 'x');
  v_key text := 'k:' || left(coalesce(p_key, 'local'), 96);
  v_day text := 'day:' || v_uso || ':' || to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
  v_hits integer; v_start timestamptz;
begin
  select hits, window_start into v_hits, v_start from public.rate_limits where bucket = v_key for update;
  if not found or v_start < now() - make_interval(mins => p_window_min) then
    insert into public.rate_limits (bucket, hits, window_start) values (v_key, 1, now())
      on conflict (bucket) do update set hits = 1, window_start = now();
  else
    update public.rate_limits set hits = hits + 1 where bucket = v_key;
    if v_hits + 1 > p_max then return false; end if;
  end if;
  insert into public.rate_limits (bucket, hits) values (v_day, 1)
    on conflict (bucket) do update set hits = rate_limits.hits + 1 returning hits into v_hits;
  return v_hits <= p_max_day;
end $$;
revoke all on function public.rate_allow(text, integer, integer, integer) from public, anon, authenticated;

create or replace function public.rate_limits_cleanup()
returns void language sql security definer set search_path = public as $$
  delete from public.rate_limits where window_start < now() - interval '2 days';
$$;
revoke all on function public.rate_limits_cleanup() from public, anon, authenticated;

-- ---------- pedidos ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  user_id uuid references public.profiles(id) on delete set null,
  status public.order_status not null default 'pending',
  subtotal_clp integer not null default 0 check (subtotal_clp >= 0),
  discount_clp integer not null default 0 check (discount_clp >= 0),
  shipping_clp integer not null default 0 check (shipping_clp >= 0),
  total_clp integer not null default 0 check (total_clp >= 0),
  promo_code text,
  address jsonb not null,
  notes text,
  admin_notes text,
  guest_email text not null,
  guest_name text not null,
  guest_phone text not null,
  guest_token text not null,
  checkout_key uuid not null,
  terms_version text,
  payment_method text check (payment_method is null or payment_method in ('mercadopago')),
  payment_id text,
  payment_url text,
  payment_amount_clp integer,
  payment_state text check (payment_state is null or payment_state in ('processing')),
  paid_at timestamptz,
  tracking text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists orders_number_key on public.orders (number);
create unique index if not exists orders_checkout_key on public.orders (guest_email, checkout_key);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_email_idx on public.orders (guest_email);
create index if not exists orders_payment_idx on public.orders (payment_id) where payment_id is not null;
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  name text not null,
  sku text not null,
  variant_label text,
  unit_price_clp integer not null check (unit_price_clp >= 0),
  quantity integer not null check (quantity between 1 and 20),
  image_url text
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_id uuid references public.profiles(id) on delete set null,
  note text,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at desc);

-- Historial de estados.
create or replace function public.log_order_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, from_status, to_status, actor_id) values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_events (order_id, from_status, to_status, actor_id, note) values (new.id, old.status, new.status, auth.uid(), new.admin_notes);
  end if;
  return null;
end $$;
drop trigger if exists orders_log_event on public.orders;
create trigger orders_log_event after insert or update on public.orders for each row execute function public.log_order_event();

-- Máquina de estados + total recalculado + envío bloqueado tras el pago.
create or replace function public.guard_order_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status and not (
    (old.status = 'pending' and new.status in ('paid', 'cancelled')) or
    (old.status = 'paid' and new.status in ('preparing', 'cancelled')) or
    (old.status = 'preparing' and new.status in ('shipped', 'cancelled')) or
    (old.status = 'shipped' and new.status = 'delivered')
  ) then raise exception 'invalid order transition' using errcode = '22023'; end if;
  if new.shipping_clp is distinct from old.shipping_clp and old.status <> 'pending' then
    raise exception 'shipping locked after payment' using errcode = '22023';
  end if;
  new.total_clp := greatest(0, new.subtotal_clp - new.discount_clp) + new.shipping_clp;
  -- Si cambia el total antes de pagar, el link de pago anterior deja de valer.
  if new.status = 'pending' and new.total_clp is distinct from old.total_clp then
    new.payment_url := null; new.payment_id := null; new.payment_amount_clp := null;
  end if;
  return new;
end $$;
drop trigger if exists orders_guard_update on public.orders;
create trigger orders_guard_update before update on public.orders for each row execute function public.guard_order_update();

-- Al cancelar se devuelve el stock reservado.
create or replace function public.orders_restore_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.products p set stock = p.stock + oi.quantity
    from public.order_items oi where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return null;
end $$;
drop trigger if exists orders_restore_stock on public.orders;
create trigger orders_restore_stock after update of status on public.orders for each row execute function public.orders_restore_stock();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
-- Los pedidos de invitado se leen siempre con service_role (token en la URL/cookie),
-- el panel usa la sesión admin.
drop policy if exists "orders: admin read" on public.orders;
create policy "orders: admin read" on public.orders for select to authenticated using ((select public.is_admin()));
drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update" on public.orders for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
revoke update on public.orders from authenticated;
grant update (status, admin_notes, shipping_clp, tracking) on public.orders to authenticated;
drop policy if exists "order_items: admin read" on public.order_items;
create policy "order_items: admin read" on public.order_items for select to authenticated using ((select public.is_admin()));
drop policy if exists "order_events: admin read" on public.order_events;
create policy "order_events: admin read" on public.order_events for select to authenticated using ((select public.is_admin()));

create or replace view public.orders_view with (security_invoker = true) as
select o.*,
  (select count(*) from public.order_items i where i.order_id = o.id)::int as item_count,
  (select coalesce(sum(i.quantity), 0) from public.order_items i where i.order_id = o.id)::int as units
from public.orders o;

-- Crear pedido de invitado: valida precios, descuenta stock, calcula envío y descuento.
create or replace function public.create_guest_order(
  p_items jsonb, p_contact jsonb, p_address jsonb, p_request_id uuid, p_terms_version text,
  p_notes text default null, p_promo_code text default null)
returns table (new_order_id uuid, access_token text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_email text := lower(trim(p_contact->>'email'));
  v_order uuid; v_token text; v_item jsonb; v_product public.products%rowtype;
  v_qty int; v_subtotal int := 0; v_units int := 0; v_pct int := 0; v_discount int := 0;
  v_shipping int; v_free_min int; v_updated int; v_variant text;
begin
  if p_request_id is null then raise exception 'request id required' using errcode = '22023'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email' using errcode = '22023'; end if;
  if length(coalesce(p_contact->>'name', '')) < 2 or length(coalesce(p_contact->>'phone', '')) < 7 then
    raise exception 'invalid contact' using errcode = '22023';
  end if;
  select o.id, o.guest_token into v_order, v_token from public.orders o where o.guest_email = v_email and o.checkout_key = p_request_id;
  if found then new_order_id := v_order; access_token := v_token; return next; return; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'invalid cart' using errcode = '22023';
  end if;
  if (select count(distinct (item->>'product_id') || coalesce(item->>'variant', '')) from jsonb_array_elements(p_items) item) <> jsonb_array_length(p_items) then
    raise exception 'duplicate or missing product' using errcode = '22023';
  end if;
  if length(coalesce(p_notes, '')) > 300 then raise exception 'notes too long' using errcode = '22023'; end if;
  if (select count(*) from public.orders where guest_email = v_email and status = 'pending') >= 3 then
    raise exception 'pending order limit' using errcode = '22023';
  end if;
  select shipping_clp, free_shipping_min_clp into v_shipping, v_free_min from public.shop_settings where id = 1;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.orders(address, notes, checkout_key, terms_version, guest_email, guest_name, guest_phone, guest_token)
  values (p_address, nullif(trim(p_notes), ''), p_request_id, p_terms_version, v_email, left(trim(p_contact->>'name'), 80), left(trim(p_contact->>'phone'), 20), v_token)
  returning id into v_order;
  for v_item in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
    if coalesce(v_item->>'quantity', '') !~ '^[0-9]{1,2}$' then raise exception 'invalid quantity' using errcode = '22023'; end if;
    v_qty := (v_item->>'quantity')::int;
    if v_qty not between 1 and 20 then raise exception 'invalid quantity' using errcode = '22023'; end if;
    v_units := v_units + v_qty;
    if v_units > 12 then raise exception 'guest unit limit' using errcode = 'P0001'; end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and active for update;
    if not found then raise exception 'product unavailable' using errcode = 'P0002'; end if;
    if (v_item->>'unit_price_clp')::numeric is distinct from v_product.price_clp::numeric then
      raise exception 'price changed' using errcode = '22023';
    end if;
    v_variant := nullif(trim(coalesce(v_item->>'variant', '')), '');
    if v_variant is not null and jsonb_array_length(v_product.variants) > 0
       and not exists (select 1 from jsonb_array_elements(v_product.variants) v where v->>'title' = v_variant) then
      raise exception 'invalid variant' using errcode = '22023';
    end if;
    update public.products set stock = stock - v_qty where id = v_product.id and stock >= v_qty;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then raise exception 'insufficient stock for %', v_product.name using errcode = 'P0001'; end if;
    insert into public.order_items(order_id, product_id, name, sku, variant_label, unit_price_clp, quantity, image_url)
    values (v_order, v_product.id, v_product.name, v_product.sku, v_variant, v_product.price_clp, v_qty, v_product.image_url);
    v_subtotal := v_subtotal + v_product.price_clp * v_qty;
  end loop;
  if p_promo_code is not null and p_promo_code <> '' then
    v_pct := public.promo_pct(p_promo_code, v_subtotal);
    if v_pct = 0 then raise exception 'invalid promo' using errcode = '22023'; end if;
    v_discount := (v_subtotal * v_pct) / 100;
    update public.promo_codes set uses = uses + 1 where code = upper(trim(p_promo_code));
  end if;
  if v_subtotal - v_discount >= v_free_min then v_shipping := 0; end if;
  update public.orders set subtotal_clp = v_subtotal, discount_clp = v_discount, shipping_clp = v_shipping,
    promo_code = case when v_pct > 0 then upper(trim(p_promo_code)) end where id = v_order;
  new_order_id := v_order; access_token := v_token; return next;
end $$;
revoke all on function public.create_guest_order(jsonb, jsonb, jsonb, uuid, text, text, text) from public, anon, authenticated;

-- Cancelación por el comprador (solo pendiente). Devuelve true si canceló.
create or replace function public.cancel_guest_order(p_order uuid, p_token text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_ok int;
begin
  update public.orders set status = 'cancelled', admin_notes = coalesce(admin_notes || ' · ', '') || 'Cancelado por el comprador'
  where id = p_order and guest_token = p_token and status = 'pending';
  get diagnostics v_ok = row_count;
  return v_ok > 0;
end $$;
revoke all on function public.cancel_guest_order(uuid, text) from public, anon, authenticated;

-- Pendientes viejos se cancelan (liberan stock). Devuelve los ids cancelados.
create or replace function public.expire_pending_orders(p_hours integer default 48)
returns setof uuid language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.orders set status = 'cancelled',
    admin_notes = coalesce(admin_notes || ' · ', '') || 'Cancelado automáticamente: sin pago en ' || p_hours || ' h'
  where status = 'pending' and created_at < now() - make_interval(hours => p_hours)
  returning id;
end $$;
revoke all on function public.expire_pending_orders(integer) from public, anon, authenticated;

-- ---------- búsqueda ----------
create or replace function public.search_catalog(p_q text, p_limit int default 8)
returns table (kind text, id uuid, slug text, name text, sub text, image_url text, price_clp integer, rank real)
language sql stable security definer set search_path = public, extensions as $$
  with q as (select lower(trim(p_q)) as t)
  select * from (
    (select 'product'::text as kind, p.id, p.slug, p.name, coalesce(p.color_label, '') as sub, p.image_url, p.price_clp,
      greatest(similarity(lower(p.name), q.t), case when lower(p.name) like '%' || q.t || '%' then 0.9 else 0 end,
               case when lower(p.sku) like '%' || q.t || '%' then 0.7 else 0 end)::real as rank
     from public.products p, q
     where p.active and length(q.t) >= 2
       and (lower(p.name) like '%' || q.t || '%' or lower(p.sku) like '%' || q.t || '%' or similarity(lower(p.name), q.t) > 0.25))
    union all
    (select 'collection'::text, c.id, c.slug, c.name, c.tagline, c.image_url, null::integer,
      greatest(similarity(lower(c.name), q.t), case when lower(c.name) like '%' || q.t || '%' then 0.85 else 0 end)::real
     from public.collections c, q
     where c.active and length(q.t) >= 2 and (lower(c.name) like '%' || q.t || '%' or similarity(lower(c.name), q.t) > 0.3))
  ) s order by s.rank desc, s.name limit p_limit
$$;
grant execute on function public.search_catalog(text, int) to anon, authenticated;

-- ---------- storage: fotos de producto ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 26214400, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true;
drop policy if exists "productos: public read" on storage.objects;
create policy "productos: public read" on storage.objects for select using (bucket_id = 'productos');
drop policy if exists "productos: admin insert" on storage.objects;
create policy "productos: admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'productos' and (select public.is_admin()));
drop policy if exists "productos: admin update" on storage.objects;
create policy "productos: admin update" on storage.objects for update to authenticated using (bucket_id = 'productos' and (select public.is_admin()));
drop policy if exists "productos: admin delete" on storage.objects;
create policy "productos: admin delete" on storage.objects for delete to authenticated using (bucket_id = 'productos' and (select public.is_admin()));

-- ---------- grants para la Data API ----------
grant usage on schema public to anon, authenticated;
grant select on public.products, public.collections, public.collections_view, public.product_collections, public.shop_settings to anon, authenticated;
grant select on public.profiles, public.orders, public.orders_view, public.order_items, public.order_events, public.promo_codes, public.bootstrap_superadmins to authenticated;
grant insert, update, delete on public.products, public.collections, public.product_collections, public.promo_codes to authenticated;
grant update on public.shop_settings to authenticated;
