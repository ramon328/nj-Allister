"use client";
import { useState } from "react";
import { Btn } from "@/components/ui";
import type { ProductRow, ProductVariant } from "@/lib/supabase/database.types";
import { cart } from "../store";

export function AddToCart({ product }: { product: Pick<ProductRow, "id" | "slug" | "name" | "sku" | "color_label" | "price_clp" | "compare_price_clp" | "image_url" | "variants" | "stock"> }) {
  const variants = (product.variants ?? []) as ProductVariant[];
  const [variant, setVariant] = useState<string>(variants.find((v) => v.available !== false)?.title ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;

  function add() {
    if (out) return;
    cart.add({ productId: product.id, slug: product.slug, name: product.name, sku: product.sku, colorLabel: product.color_label, variant: variants.length ? variant : null, price: product.price_clp, comparePrice: product.compare_price_clp, image: product.image_url }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="buy">
      {variants.length > 0 ? (
        <div className="buy__variants" role="radiogroup" aria-label="Opción">
          <p className="field-label">Fuerza óptica</p>
          <div className="chips">
            {variants.map((v) => (
              <button key={v.title} type="button" role="radio" aria-checked={variant === v.title} className={`chip ${variant === v.title ? "is-on" : ""}`} disabled={v.available === false} onClick={() => setVariant(v.title)}>
                {v.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="buy__row">
        <div className="qty qty--lg" role="group" aria-label="Cantidad">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos" disabled={qty <= 1}>−</button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(Math.max(1, product.stock), q + 1))} aria-label="Más" disabled={qty >= product.stock}>+</button>
        </div>
        <Btn type="button" size="lg" onClick={add} disabled={out} className="buy__btn">
          {out ? "Agotado" : added ? "Agregado ✓" : "Agregar al carro"}
        </Btn>
      </div>
      {!out && product.stock <= 3 ? <p className="buy__stock">Quedan {product.stock} unidades.</p> : null}
    </div>
  );
}
