// Carga el catálogo exportado de Shopify (supabase/data/shopify/*.json) en Postgres.
// Idempotente: reconoce productos por shopify_id y actualiza precio, fotos y colecciones.
// Uso: npm run db:seed
import { readFileSync } from "node:fs";
import { dbClient } from "./db-migrate.mjs";

const read = (f) => JSON.parse(readFileSync(`supabase/data/shopify/${f}`, "utf8"));
const products = read("products.json").products;
const collectionsMeta = read("collections.json").collections;

const COLLECTION_INFO = {
  luxe: { name: "LUXE", tagline: "Sol · Polarizados UV400", badge: "Envío gratis", sort: 1, kind: "sol",
    description: "Descubre el mundo sin reflejos. Lentes polarizados, marcos de acetato y detalles metálicos." },
  "generacion-a": { name: "Generación-A", tagline: "Sol · Colores vibrantes", badge: "40% OFF", sort: 2, kind: "sol",
    description: "Estilos atrevidos y colores vibrantes que inspiran libertad." },
  "filtro-azul": { name: "Filtro Azul", tagline: "Óptico · Anti luz azul", badge: "20% OFF", sort: 3, kind: "optico",
    description: "Lentes orgánicos con filtro azul, antirreflejo y UV. Para pantallas y uso diario." },
  lectura: { name: "Lectura Magnéticos", tagline: "Lectura · Cierre magnético", badge: "2x1", sort: 4, kind: "lectura",
    description: "Lentes orgánicos con protección UV y cierre magnético al cuello." },
  oferta: { name: "Ofertas", tagline: "Hasta 50% de descuento", badge: "Hasta 50%", sort: 5, kind: null,
    description: "Descuentos en todas las colecciones." },
};
const LOCAL_IMAGES = {
  luxe: "/assets/web/hero-generacion-a.jpg",
  "generacion-a": "/assets/web/hero-sol-sin-reflejos.jpg",
  "filtro-azul": "/assets/web/hero-filtro-azul.jpg",
  lectura: "/assets/web/hero-lectura.jpg",
  oferta: "/assets/web/banner-ofertas-hombre-sombrero.jpg",
};

const titleCase = (s) => s.toLowerCase().replace(/(^|[\s/-])([a-záéíóúñ])/g, (m, a, b) => a + b.toUpperCase());
const stripHtml = (h) => (h ?? "")
  .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/li>/gi, "\n").replace(/<li[^>]*>/gi, "• ")
  .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

/** "ANTEOJO DE SOL, RACHEL-BROWN,Polarizados" → { kind, model, color, name, features } */
function parseTitle(raw) {
  const t = raw.replace(/\s+/g, " ").trim();
  const kind = /LECTURA/i.test(t) ? "lectura" : /ÓPTICO|OPTICO/i.test(t) ? "optico" : "sol";
  let rest = t.replace(/^ANTEOJOS?\s+(DE\s+SOL|ÓPTICOS?|OPTICOS?|DE\s+LECTURA\s+MAGN[ÉE]TICOS?|DE\s+LECTURA)\s*[,.:]?\s*/i, "");
  rest = rest.replace(/^MOD\.?:?\s*/i, "");
  const features = [];
  if (/polarizad/i.test(t)) features.push("Polarizado");
  if (/\bUV\b/i.test(t)) features.push("UV 400");
  if (/anti\s*blue|filtro\s*azul/i.test(t)) features.push("Filtro azul");
  if (/espejad/i.test(t)) features.push("Espejado");
  if (/magn[ée]tic/i.test(t)) features.push("Cierre magnético");
  if (/org[áa]nic/i.test(t)) features.push("Lentes orgánicos");
  const main = rest.split(/,\s*(?:polarizad|uv|anti|filtro|lentes|espejad)/i)[0].split(/\.\s*(?:anti|filtro|lentes)/i)[0].replace(/[.,]+$/, "").trim();
  let [model, ...colorParts] = main.split(/\s*[-–]\s*/);
  let color = colorParts.join(" ").replace(/\s*,.*$/, "").trim();
  if (!color && model.includes(",")) [model, color] = model.split(/\s*,\s*/);
  model = (model ?? "").replace(/,.*$/, "").trim();
  color = (color ?? "").replace(/\s*\/\s*/g, " / ").replace(/[.,]?\s*(polarizad[oa]s?|uv\.?|anti\s*blue\s*light|filtro\s*azul|espejad[oa]s?\.?polarizad[oa]s?)\s*/gi, " ").replace(/\s{2,}/g, " ").replace(/[.,\s]+$/, "").trim();
  model = model.replace(/[.,\s]+$/, "").trim();
  return { kind, model: titleCase(model), color: color ? titleCase(color) : null, features };
}

const client = dbClient();
await client.connect();
await client.query("begin");
try {
  // Colecciones
  const colIds = {};
  for (const meta of collectionsMeta) {
    const info = COLLECTION_INFO[meta.handle];
    if (!info) continue;
    const r = await client.query(
      `insert into public.collections (slug, name, tagline, description, image_url, badge, sort, active)
       values ($1,$2,$3,$4,$5,$6,$7,true)
       on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, description = excluded.description, badge = excluded.badge, sort = excluded.sort
       returning id`,
      [meta.handle, info.name, info.tagline, info.description, LOCAL_IMAGES[meta.handle] ?? meta.image?.src ?? null, info.badge, info.sort],
    );
    colIds[meta.handle] = r.rows[0].id;
  }
  // Membresías desde los JSON por colección
  const membership = new Map();
  for (const handle of Object.keys(COLLECTION_INFO)) {
    const list = read(`collection-${handle}.json`).products;
    for (const p of list) {
      if (!membership.has(p.id)) membership.set(p.id, new Set());
      membership.get(p.id).add(handle);
    }
  }
  const seenSku = new Set();
  const seenSlug = new Set();
  let n = 0;
  for (const p of products) {
    const { kind, model, color, features } = parseTitle(p.title);
    const v0 = p.variants[0];
    let sku = (v0.sku || `SHOP-${p.id}`).toUpperCase().replace(/[^A-Z0-9._-]/g, "-");
    if (seenSku.has(sku)) sku = `${sku}-${String(p.id).slice(-4)}`;
    seenSku.add(sku);
    const price = Math.round(Number(v0.price));
    const compare = v0.compare_at_price ? Math.round(Number(v0.compare_at_price)) : null;
    const images = p.images.map((i) => i.src.split("?")[0]);
    const available = p.variants.some((v) => v.available);
    const variants = p.options?.[0]?.name && p.options[0].name !== "Title"
      ? p.variants.map((v) => ({ title: v.title, sku: v.sku, available: v.available }))
      : [];
    const name = color ? `${model} ${color}` : model;
    let slug = p.handle.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 90);
    if (!/^[a-z0-9]/.test(slug)) slug = `p-${slug}`;
    if (seenSlug.has(slug)) slug = `${slug}-${String(p.id).slice(-4)}`;
    seenSlug.add(slug);
    const tags = [...p.tags, ...(membership.get(p.id) ?? [])].map((t) => t.toLowerCase());
    const r = await client.query(
      `insert into public.products (sku, slug, name, model_code, color_label, kind, description, features, price_clp, compare_price_clp,
         image_url, gallery_images, variants, stock, active, featured, tags, shopify_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       on conflict (shopify_id) do update set name = excluded.name, model_code = excluded.model_code, color_label = excluded.color_label,
         kind = excluded.kind, description = excluded.description, features = excluded.features, price_clp = excluded.price_clp,
         compare_price_clp = excluded.compare_price_clp, image_url = excluded.image_url, gallery_images = excluded.gallery_images,
         variants = excluded.variants, tags = excluded.tags, active = excluded.active
       returning id`,
      [sku, slug, name.slice(0, 160), model.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32) || null, color, kind,
        stripHtml(p.body_html), features, price, compare && compare > price ? compare : null,
        images[0] ?? null, images.slice(1, 40), JSON.stringify(variants), available ? 10 : 0, available, false, tags, p.id],
    );
    const id = r.rows[0].id;
    const handles = [...(membership.get(p.id) ?? [])].filter((h) => colIds[h]);
    await client.query("delete from public.product_collections where product_id = $1", [id]);
    for (const h of handles) await client.query("insert into public.product_collections (product_id, collection_id) values ($1,$2) on conflict do nothing", [id, colIds[h]]);
    n++;
  }
  // Destacados para la portada: 8 con mejor foto/precio, uno por modelo.
  await client.query(`update public.products set featured = false`);
  await client.query(`
    with ranked as (
      select id, row_number() over (partition by model_code order by (compare_price_clp is not null) desc, price_clp desc) rn
      from public.products where active and stock > 0 and kind = 'sol')
    update public.products p set featured = true from (select id from ranked where rn = 1 order by random() limit 8) f where p.id = f.id`);
  await client.query("commit");
  console.log(`seed ok: ${n} productos, colecciones: ${Object.keys(colIds).join(", ")}`);
} catch (e) {
  await client.query("rollback");
  console.error("seed FAIL", e.message);
  process.exitCode = 1;
}
await client.end();
