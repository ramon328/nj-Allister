import { adminListCollections } from "@/features/catalog/queries";
import { CollectionForm } from "@/features/admin/ui/forms";

export default async function CollectionsPage() {
  const collections = await adminListCollections();
  return (
    <div className="stack">
      <h1 className="h2">Colecciones</h1>
      {collections.map((c) => (
        <details key={c.id} className="acollapse">
          <summary><strong>{c.name}</strong> <small className="muted">/{c.slug} · {c.product_count} productos · {c.active ? "visible" : "oculta"}</small></summary>
          <CollectionForm c={c} />
        </details>
      ))}
      <details className="acollapse"><summary><strong>Nueva colección</strong></summary><CollectionForm /></details>
    </div>
  );
}
