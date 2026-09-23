"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin, assertSuperadmin } from "@/lib/auth/session";
import { flatten, type FormState } from "@/lib/form-state";
import { collectionSchema, productSchema, promoSchema, settingsSchema } from "./schemas";

function revalidateCatalog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/coleccion");
  revalidatePath("/admin/productos");
  if (slug) revalidatePath(`/lentes/${slug}`);
}

function parseProduct(formData: FormData) {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  raw.collections = formData.getAll("collections").map(String);
  return productSchema.safeParse(raw);
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = parseProduct(formData);
  if (!parsed.success) return { status: "error", fieldErrors: flatten(parsed.error), message: "Revisa los campos." };
  const { collections, ...p } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(p).select("id").single();
  if (error) return { status: "error", message: error.message.includes("duplicate") ? "Ya existe un producto con ese SKU o slug." : error.message };
  await supabase.rpc("set_product_collections", { p_product: data.id, p_collections: collections });
  revalidateCatalog(p.slug);
  redirect(`/admin/productos/${data.id}?ok=1`);
}

export async function updateProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Producto inválido." };
  const parsed = parseProduct(formData);
  if (!parsed.success) return { status: "error", fieldErrors: flatten(parsed.error), message: "Revisa los campos." };
  const { collections, ...p } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("products").update(p).eq("id", id.data);
  if (error) return { status: "error", message: error.message.includes("duplicate") ? "Ya existe un producto con ese SKU o slug." : error.message };
  await supabase.rpc("set_product_collections", { p_product: id.data, p_collections: collections });
  revalidateCatalog(p.slug);
  revalidatePath(`/admin/productos/${id.data}`);
  return { status: "success", message: "Producto guardado." };
}

export async function setProductStock(id: string, stock: number): Promise<FormState> {
  await assertAdmin();
  if (!z.string().uuid().safeParse(id).success || !Number.isInteger(stock) || stock < 0) return { status: "error", message: "Valor inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ stock }).eq("id", id);
  revalidateCatalog();
  return error ? { status: "error", message: error.message } : { status: "success" };
}

export async function deleteProduct(id: string): Promise<FormState> {
  await assertSuperadmin();
  if (!z.string().uuid().safeParse(id).success) return { status: "error", message: "Producto inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { status: "error", message: error.message.includes("violates foreign key") ? "Tiene pedidos asociados: desactívalo en vez de borrarlo." : error.message };
  revalidateCatalog();
  redirect("/admin/productos");
}

/** Sube fotos desde el computador al bucket `productos/<SKU>/`, normalizadas a webp 1600px. */
export async function uploadProductPhotos(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Producto inválido." };
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 30);
  if (files.length === 0) return { status: "error", message: "Elige al menos una foto." };
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("id, sku, image_url, gallery_images").eq("id", id.data).maybeSingle();
  if (!product) return { status: "error", message: "Producto no encontrado." };
  const urls: string[] = [];
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/+$/, "");
  for (const f of files) {
    if (f.size > 25 * 1024 * 1024) return { status: "error", message: `${f.name} supera 25 MB.` };
    let buf: Buffer;
    try {
      buf = await sharp(Buffer.from(await f.arrayBuffer())).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    } catch {
      return { status: "error", message: `${f.name} no es una imagen válida.` };
    }
    const name = `${product.sku}/u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.webp`;
    const { error } = await supabase.storage.from("productos").upload(name, buf, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (error) return { status: "error", message: `No se pudo subir ${f.name}: ${error.message}` };
    urls.push(`${base}/storage/v1/object/public/productos/${name}`);
  }
  const gallery = [...product.gallery_images, ...urls].slice(0, 40);
  const update = product.image_url ? { gallery_images: gallery } : { image_url: urls[0], gallery_images: gallery.slice(1) };
  await supabase.from("products").update(update).eq("id", id.data);
  revalidateCatalog();
  revalidatePath(`/admin/productos/${id.data}`);
  return { status: "success", message: `${urls.length} foto(s) subida(s).` };
}

export async function saveCollection(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: flatten(parsed.error), message: "Revisa los campos." };
  const { id, ...c } = parsed.data;
  const supabase = await createClient();
  const { error } = id ? await supabase.from("collections").update(c).eq("id", id) : await supabase.from("collections").insert(c);
  if (error) return { status: "error", message: error.message.includes("duplicate") ? "Ya existe una colección con ese slug." : error.message };
  revalidateCatalog();
  revalidatePath("/admin/colecciones");
  return { status: "success", message: "Colección guardada." };
}

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: flatten(parsed.error), message: "Revisa los campos." };
  const supabase = await createClient();
  const { error } = await supabase.from("shop_settings").update(parsed.data).eq("id", 1);
  if (error) return { status: "error", message: error.message };
  revalidatePath("/", "layout");
  return { status: "success", message: "Configuración guardada." };
}

export async function savePromo(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = promoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: flatten(parsed.error), message: "Revisa los campos." };
  const supabase = await createClient();
  const { error } = await supabase.from("promo_codes").upsert(parsed.data, { onConflict: "code" });
  if (error) return { status: "error", message: error.message };
  revalidatePath("/admin/descuentos");
  return { status: "success", message: "Código guardado." };
}

export async function deletePromo(code: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("promo_codes").delete().eq("code", code);
  revalidatePath("/admin/descuentos");
}
