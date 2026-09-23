"use client";
import { useSyncExternalStore } from "react";
import { parseCart, lineKey, type CartItem, type CartState as State } from "./persistence";
export type { CartItem } from "./persistence";

/**
 * Carrito en localStorage + useSyncExternalStore (sin librería).
 * Sincroniza entre pestañas con el evento `storage`. Máximo 20 líneas, 20 por línea.
 */
const KEY = "allister.cart.v1";
const MAX_QTY = 20;
const listeners = new Set<() => void>();
let state: State = { items: [] };
let loaded = false;
const EMPTY: State = { items: [] };

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = parseCart(localStorage.getItem(KEY));
  } catch {
    state = { items: [] };
  }
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) {
      state = parseCart(e.newValue);
      listeners.forEach((l) => l());
    }
  });
}
function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sigue en memoria */
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

export const cart = {
  add(item: Omit<CartItem, "quantity">, qty = 1) {
    load();
    if (!Number.isInteger(qty) || qty < 1) return;
    const k = lineKey(item);
    const existing = state.items.find((i) => lineKey(i) === k);
    if (!existing && state.items.length >= 20) return;
    const items = existing
      ? state.items.map((i) => (lineKey(i) === k ? { ...item, quantity: Math.min(MAX_QTY, i.quantity + qty) } : i))
      : [...state.items, { ...item, quantity: Math.min(MAX_QTY, qty) }];
    state = { items };
    emit();
    drawer.open();
  },
  setQty(key: string, qty: number) {
    load();
    if (!Number.isInteger(qty)) return;
    state = { items: state.items.map((i) => (lineKey(i) === key ? { ...i, quantity: Math.max(1, Math.min(MAX_QTY, qty)) } : i)) };
    emit();
  },
  remove(key: string) {
    load();
    state = { items: state.items.filter((i) => lineKey(i) !== key) };
    emit();
  },
  clear() {
    load();
    state = { items: [] };
    emit();
  },
};

export function useCart(): State {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}
export const cartCount = (s: State) => s.items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (s: State) => s.items.reduce((n, i) => n + i.price * i.quantity, 0);
export { lineKey };

/* Estado del panel lateral del carrito. */
const drawerListeners = new Set<() => void>();
let drawerOpen = false;
export const drawer = {
  open() { drawerOpen = true; drawerListeners.forEach((l) => l()); },
  close() { drawerOpen = false; drawerListeners.forEach((l) => l()); },
  toggle() { drawerOpen = !drawerOpen; drawerListeners.forEach((l) => l()); },
};
export function useDrawer(): boolean {
  return useSyncExternalStore(
    (l) => { drawerListeners.add(l); return () => drawerListeners.delete(l); },
    () => drawerOpen,
    () => false,
  );
}
