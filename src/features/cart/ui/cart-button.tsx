"use client";
import { cartCount, drawer, useCart } from "../store";

export function CartButton() {
  const state = useCart();
  const n = cartCount(state);
  return (
    <button type="button" className="nav__icon nav__cart" aria-label={`Carro de compras, ${n} productos`} onClick={() => drawer.toggle()}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
      <span className={`nav__count ${n > 0 ? "is-on" : ""}`}>{n}</span>
    </button>
  );
}
