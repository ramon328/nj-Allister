"use client";
import Image from "next/image";
import { formatCLP } from "@/lib/format";
import { ArrowIcon } from "@/components/ui";
import { cart, cartSubtotal, lineKey, useCart } from "../store";

export function CartPage({ freeShippingMin, shipping }: { freeShippingMin: number; shipping: number }) {
  const state = useCart();
  const subtotal = cartSubtotal(state);
  const ship = subtotal >= freeShippingMin ? 0 : shipping;
  if (state.items.length === 0) {
    return (
      <div className="empty">
        <p>Tu carro está vacío.</p>
        <a href="/coleccion" className="btn btn--dark"><span>Ver la colección</span><i className="btn__icon"><ArrowIcon /></i></a>
      </div>
    );
  }
  return (
    <div className="cartpage">
      <ul className="cartpage__list">
        {state.items.map((i) => {
          const k = lineKey(i);
          return (
            <li key={k} className="line line--lg">
              <a href={`/lentes/${i.slug}`} className="line__img">{i.image ? <Image src={i.image} alt="" width={160} height={160} /> : null}</a>
              <div className="line__body">
                <a href={`/lentes/${i.slug}`} className="line__name">{i.name}</a>
                <p className="line__meta">{[i.colorLabel, i.variant].filter(Boolean).join(" · ") || i.sku}</p>
                <p className="line__unit">{formatCLP(i.price)} c/u {i.comparePrice ? <s>{formatCLP(i.comparePrice)}</s> : null}</p>
                <div className="line__row">
                  <div className="qty" role="group" aria-label="Cantidad">
                    <button type="button" onClick={() => cart.setQty(k, i.quantity - 1)} aria-label="Menos" disabled={i.quantity <= 1}>−</button>
                    <span>{i.quantity}</span>
                    <button type="button" onClick={() => cart.setQty(k, i.quantity + 1)} aria-label="Más" disabled={i.quantity >= 20}>+</button>
                  </div>
                  <p className="line__price">{formatCLP(i.price * i.quantity)}</p>
                </div>
              </div>
              <button type="button" className="line__remove" onClick={() => cart.remove(k)}>Quitar</button>
            </li>
          );
        })}
      </ul>
      <aside className="cartpage__aside">
        <dl className="totals">
          <div><dt>Subtotal</dt><dd>{formatCLP(subtotal)}</dd></div>
          <div><dt>Despacho</dt><dd>{ship > 0 ? formatCLP(ship) : "Gratis"}</dd></div>
          <div className="totals__total"><dt>Total</dt><dd>{formatCLP(subtotal + ship)}</dd></div>
        </dl>
        {ship > 0 ? <p className="muted">Envío gratis desde {formatCLP(freeShippingMin)}.</p> : null}
        <a href="/checkout" className="btn btn--dark btn--lg"><span>Ir a pagar</span><i className="btn__icon"><ArrowIcon /></i></a>
        <p className="muted">Pago seguro con Mercado Pago: tarjeta de crédito, débito o cuotas. Los códigos de descuento se aplican en el checkout.</p>
      </aside>
    </div>
  );
}
