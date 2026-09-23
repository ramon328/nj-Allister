"use client";
import { useActionState, useState } from "react";
import Image from "next/image";
import { Banner, Btn, Field, Input, Select, Textarea } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";
import { slugify } from "@/lib/format";
import type { CollectionView, ProductRow } from "@/lib/supabase/database.types";
import { createProduct, deleteProduct, updateProduct, uploadProductPhotos } from "../actions";

export function ProductForm({ product, collections, selected, canDelete }: { product?: ProductRow; collections: CollectionView[]; selected: string[]; canDelete?: boolean }) {
  const [state, action, pending] = useActionState(product ? updateProduct : createProduct, initialFormState);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="aform" noValidate>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="aform__grid">
        <Field label="Nombre" name="name" error={fe.name}><Input name="name" value={name} onChange={(e) => { setName(e.target.value); if (!product) setSlug(slugify(e.target.value)); }} required error={fe.name} /></Field>
        <Field label="Slug (URL)" name="slug" error={fe.slug}><Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required error={fe.slug} /></Field>
        <Field label="SKU" name="sku" error={fe.sku}><Input name="sku" defaultValue={product?.sku ?? ""} required error={fe.sku} /></Field>
        <Field label="Tipo" name="kind" error={fe.kind}>
          <Select name="kind" defaultValue={product?.kind ?? "sol"}><option value="sol">Sol</option><option value="optico">Óptico</option><option value="lectura">Lectura</option></Select>
        </Field>
        <Field label="Modelo (agrupa colores)" name="model_code" hint="Mismo código = mismo modelo en otros colores." error={fe.model_code}><Input name="model_code" defaultValue={product?.model_code ?? ""} error={fe.model_code} /></Field>
        <Field label="Color" name="color_label" error={fe.color_label}><Input name="color_label" defaultValue={product?.color_label ?? ""} error={fe.color_label} /></Field>
        <Field label="Muestra de color" name="color_hex" error={fe.color_hex}><Input name="color_hex" type="color" defaultValue={product?.color_hex ?? "#000000"} error={fe.color_hex} /></Field>
        <Field label="Precio (CLP)" name="price_clp" error={fe.price_clp}><Input name="price_clp" type="number" min={0} step={10} defaultValue={product?.price_clp ?? ""} required error={fe.price_clp} /></Field>
        <Field label="Precio antes (tachado)" name="compare_price_clp" hint="Opcional. Muestra el % de descuento." error={fe.compare_price_clp}><Input name="compare_price_clp" type="number" min={0} step={10} defaultValue={product?.compare_price_clp ?? ""} error={fe.compare_price_clp} /></Field>
        <Field label="Stock" name="stock" error={fe.stock}><Input name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} required error={fe.stock} /></Field>
      </div>
      <Field label="Descripción" name="description" error={fe.description}><Textarea name="description" rows={6} defaultValue={product?.description ?? ""} error={fe.description} /></Field>
      <div className="aform__grid">
        <Field label="Características (una por línea)" name="features" error={fe.features}><Textarea name="features" rows={4} defaultValue={(product?.features ?? []).join("\n")} placeholder={"Polarizado\nUV 400"} /></Field>
        <Field label="Etiquetas (separadas por coma)" name="tags" error={fe.tags}><Input name="tags" defaultValue={(product?.tags ?? []).join(", ")} /></Field>
      </div>
      <fieldset className="aform__fs">
        <legend>Colecciones</legend>
        <div className="chips">
          {collections.map((c) => (
            <label key={c.id} className="chip chip--check"><input type="checkbox" name="collections" value={c.id} defaultChecked={selected.includes(c.id)} /> {c.name}</label>
          ))}
        </div>
      </fieldset>
      <div className="aform__grid">
        <Field label="Foto principal (URL)" name="image_url" error={fe.image_url}><Input name="image_url" defaultValue={product?.image_url ?? ""} error={fe.image_url} /></Field>
        <Field label="Galería (una URL por línea)" name="gallery_images" error={fe.gallery_images}><Textarea name="gallery_images" rows={4} defaultValue={(product?.gallery_images ?? []).join("\n")} /></Field>
      </div>
      <div className="aform__row">
        <label className="check"><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> <span>Visible en la tienda</span></label>
        <label className="check"><input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> <span>Destacado en portada</span></label>
      </div>
      {state.status === "error" && state.message ? <Banner tone="error">{state.message}</Banner> : null}
      {state.status === "success" && state.message ? <Banner tone="success">{state.message}</Banner> : null}
      <div className="aform__row">
        <Btn type="submit" loading={pending}>{product ? "Guardar cambios" : "Crear producto"}</Btn>
        {product && canDelete ? <button type="button" className="link-underline danger" onClick={() => { if (confirm("¿Borrar este producto? Si tiene pedidos no se podrá.")) deleteProduct(product.id); }}>Borrar producto</button> : null}
      </div>
    </form>
  );
}

export function ProductPhotos({ product }: { product: ProductRow }) {
  const [state, action, pending] = useActionState(uploadProductPhotos, initialFormState);
  const all = [product.image_url, ...product.gallery_images].filter((u): u is string => Boolean(u));
  return (
    <section className="aphotos">
      <h2 className="h3">Fotos</h2>
      <div className="aphotos__grid">
        {all.map((u, i) => (
          <figure key={u} className={i === 0 ? "is-main" : ""}><Image src={u} alt="" width={200} height={200} />{i === 0 ? <figcaption>Principal</figcaption> : null}</figure>
        ))}
      </div>
      <form action={action} className="aphotos__form">
        <input type="hidden" name="id" value={product.id} />
        <input type="file" name="photos" accept="image/*" multiple className="input" />
        <Btn type="submit" loading={pending} variant="ghost">Subir fotos</Btn>
        {state.status === "error" && state.message ? <Banner tone="error">{state.message}</Banner> : null}
        {state.status === "success" && state.message ? <Banner tone="success">{state.message}</Banner> : null}
      </form>
      <p className="muted">Se optimizan a WebP de 1600px y se guardan en Supabase Storage (bucket productos/{product.sku}). Para reordenar, edita las URLs en el formulario.</p>
    </section>
  );
}
