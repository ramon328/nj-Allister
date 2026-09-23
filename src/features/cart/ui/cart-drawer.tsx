"use client";
import { useEffect } from "react";
import Image from "next/image";
import { formatCLP } from "@/lib/format";
import { ArrowIcon } from "@/components/ui";
import { cart, cartCount, cartSubtotal, drawer, lineKey, useCart, useDrawer } from "../store";

export function CartDrawer({ freeShippingMin, shipping }: { freeShippingMin: number; shipping: number }) {
  const state = useCart();
  const open = useDrawer();
  const subtotal = cartSubtotal(state);
  const falta = Math.max(0, freeShippingMin - subtotal);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") drawer.close(); };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("is-locked");
    return () => { document.removeEventListener("keydown", onKey); document.body.classList.remove("is-locked"); };
  }, [open]);

  return (
    <div className={`drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button type="button" className="drawer__backdrop" aria-label="Cerrar carro" onClick={() => drawer.close()} tabIndex={open ? 0 : -1} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-label="Tu carro">
        <header className="drawer__head">
          <h2 className="drawer__title">Tu carro <span>{cartCount(state)}</span></h2>
          <button type="button" className="drawer__close" onClick={() => drawer.close()} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {state.items.length === 0 ? (
          <div className="drawer__empty">
            <p>Tu carro está vacío.</p>
            <a href="/coleccion" className="btn btn--dark" onClick={() => drawer.close()}><span>Ver la colección</span><i className="btn__icon"><ArrowIcon /></i></a>
          </div>
        ) : (
          <>
            <p className="drawer__ship">{falta > 0 ? <>Te faltan <strong>{formatCLP(falta)}</strong> para envío gratis.</> : <>Tienes <strong>envío gratis</strong>.</>}</p>
            <div className="drawer__bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (subtotal / freeShippingMin) * 100)}%` }} /></div>
            <ul className="drawer__list">
              {state.items.map((i) => {
                const k = lineKey(i);
                return (
                  <li key={k} className="line">
                    <a href={`/lentes/${i.slug}`} className="line__img">{i.image ? <Image src={i.image} alt="" width={96} height={96} /> : null}</a>
                    <div className="line__body">
                      <a href={`/lentes/${i.slug}`} className="line__name">{i.name}</a>
                      <p className="line__meta">{[i.colorLabel, i.variant].filter(Boolean).join(" · ") || i.sku}</p>
                      <div className="line__row">
                        <div className="qty" role="group" aria-label="Cantidad">
                          <button type="button" onClick={() => cart.setQty(k, i.quantity - 1)} aria-label="Menos" disabled={i.quantity <= 1}>−</button>
                          <span>{i.quantity}</span>
                          <button type="button" onClick={() => cart.setQty(k, i.quantity + 1)} aria-label="Más" disabled={i.quantity >= 20}>+</button>
                        </div>
                        <p className="line__price">{formatCLP(i.price * i.quantity)}</p>
                      </div>
                    </div>
                    <button type="button" className="line__remove" onClick={() => cart.remove(k)} aria-label={`Quitar ${i.name}`}>Quitar</button>
                  </li>
                );
              })}
            </ul>
            <footer className="drawer__foot">
              <dl className="totals">
                <div><dt>Subtotal</dt><dd>{formatCLP(subtotal)}</dd></div>
                <div><dt>Despacho</dt><dd>{falta > 0 ? formatCLP(shipping) : "Gratis"}</dd></div>
                <div className="totals__total"><dt>Total</dt><dd>{formatCLP(subtotal + (falta > 0 ? shipping : 0))}</dd></div>
              </dl>
              <a href="/checkout" className="btn btn--dark btn--lg" onClick={() => drawer.close()}><span>Ir a pagar</span><i className="btn__icon"><ArrowIcon /></i></a>
              <a href="/carrito" className="link-underline" onClick={() => drawer.close()}>Ver carro completo</a>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
