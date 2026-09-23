import { adminListCollections } from "@/features/catalog/queries";
import { ProductForm } from "@/features/catalog/ui/product-form";

export default async function NewProductPage() {
  const collections = await adminListCollections();
  return (
    <div className="stack">
      <a href="/admin/productos" className="link-underline">← Productos</a>
      <h1 className="h2">Nuevo producto</h1>
      <ProductForm collections={collections} selected={[]} />
    </div>
  );
}
