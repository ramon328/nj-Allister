import { notFound } from "next/navigation";
import { z } from "zod";
import { adminGetProduct, adminListCollections, productCollections } from "@/features/catalog/queries";
import { ProductForm, ProductPhotos } from "@/features/catalog/ui/product-form";
import { getSessionProfile } from "@/lib/auth/session";
import { Banner } from "@/components/ui";

type SP = Record<string, string | string[] | undefined>;

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [product, collections, selected, me] = await Promise.all([adminGetProduct(id), adminListCollections(), productCollections(id), getSessionProfile()]);
  if (!product) notFound();
  return (
    <div className="stack">
      <div className="order__head"><div><a href="/admin/productos" className="link-underline">← Productos</a><h1 className="h2">{product.name}</h1></div><a href={`/lentes/${product.slug}`} className="link-underline" target="_blank" rel="noopener">Ver en la tienda ↗</a></div>
      {sp.ok === "1" ? <Banner tone="success">Producto creado. Ahora puedes subir fotos.</Banner> : null}
      <ProductPhotos product={product} />
      <ProductForm product={product} collections={collections} selected={selected} canDelete={me?.role === "superadmin"} />
    </div>
  );
}
