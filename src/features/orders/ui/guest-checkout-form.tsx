"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Banner, Btn, Field, Input, Textarea } from "@/components/ui";
import { formatCLP } from "@/lib/format";
import { cart, cartSubtotal, useCart } from "@/features/cart/store";
import { checkPromo, placeGuestOrder, type GuestCheckoutState } from "../actions";
import { ComunaPostal } from "./comuna-postal";

/** Compra sin registro: contacto + dirección + descuento en un solo paso. */
export function GuestCheckoutForm({ freeShippingMin, shipping }: { freeShippingMin: number; shipping: number }) {
  const state = useCart();
  const router = useRouter();
  const requestId = useRef<string>("");
  if (!requestId.current && typeof crypto !== "undefined") requestId.current = crypto.randomUUID();
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [promo, setPromo] = useState("");
  const [pct, setPct] = useState(0);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, action, pending] = useActionState(
    async (prev: GuestCheckoutState, fd: FormData) => {
      setSaved(Object.fromEntries([...fd.entries()].filter((e): e is [string, string] => typeof e[1] === "string")));
      const r = await placeGuestOrder(prev, fd);
      if (r.status === "success" && r.orderId && r.token) {
        cart.clear();
        router.push(`/pedido/${r.orderId}?k=${r.token}&nuevo=1`);
      }
      return r;
    },
    { status: "idle" } as GuestCheckoutState,
  );
  const subtotal = cartSubtotal(state);
  const discount = Math.floor((subtotal * pct) / 100);
  const ship = subtotal - discount >= freeShippingMin ? 0 : shipping;
  const total = subtotal - discount + ship;
  const fe = result.fieldErrors ?? {};
  const itemsJson = JSON.stringify(state.items.map((i) => ({ product_id: i.productId, variant: i.variant ?? null, quantity: i.quantity, unit_price_clp: i.price })));

  useEffect(() => {
    if (result.status === "error") document.querySelector(".banner--error")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [result]);

  async function applyPromo() {
    if (!promo.trim()) return;
    setChecking(true);
    const p = await checkPromo(promo, subtotal);
    setChecking(false);
    setPct(p);
    setPromoMsg(p > 0 ? `${p}% de descuento aplicado.` : "Código no válido o vencido.");
  }

  if (state.items.length === 0) {
    return <Banner tone="info">Tu carro está vacío. <a href="/coleccion" className="link-underline">Ver la colección</a></Banner>;
  }

  return (
    <form action={action} className="checkout" noValidate>
      <input type="hidden" name="request_id" value={requestId.current} />
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="promo_code" value={pct > 0 ? promo.trim().toUpperCase() : ""} />
      <div className="checkout__main">
        <section className="checkout__block">
          <h2 className="h3"><em>01</em> Tus datos</h2>
          <div className="grid-2">
            <Field label="Nombre y apellido" name="name" error={fe.name}><Input name="name" defaultValue={saved.name ?? ""} autoComplete="name" required error={fe.name} /></Field>
            <Field label="Teléfono" name="phone" hint="Para coordinar la entrega." error={fe.phone}><Input name="phone" defaultValue={saved.phone ?? ""} type="tel" inputMode="tel" autoComplete="tel" placeholder="+56 9 1234 5678" required error={fe.phone} /></Field>
          </div>
          <Field label="Correo" name="email" hint="Ahí te mandamos el enlace para pagar y seguir el pedido." error={fe.email}>
            <Input name="email" type="email" inputMode="email" autoComplete="email" defaultValue={saved.email ?? ""} placeholder="tu@correo.cl" required error={fe.email} />
          </Field>
        </section>

        <section className="checkout__block">
          <h2 className="h3"><em>02</em> Dirección de entrega</h2>
          <div className="grid-2 grid-2--street">
            <Field label="Calle" name="street" error={fe.street}><Input name="street" defaultValue={saved.street ?? ""} autoComplete="address-line1" required error={fe.street} /></Field>
            <Field label="Número" name="number" error={fe.number}><Input name="number" defaultValue={saved.number ?? ""} required error={fe.number} /></Field>
          </div>
          <Field label="Depto / casa / oficina" name="apartment" hint="Opcional." error={fe.apartment}><Input name="apartment" defaultValue={saved.apartment ?? ""} autoComplete="address-line2" error={fe.apartment} /></Field>
          <ComunaPostal defaults={saved} errors={{ comuna: fe.comuna, city: fe.city, region: fe.region, postal_code: fe.postal_code }} />
          <Field label="Indicaciones para la entrega" name="notes" hint="Opcional, máximo 300 caracteres." error={fe.notes}><Textarea name="notes" defaultValue={saved.notes ?? ""} rows={2} maxLength={300} error={fe.notes} /></Field>
        </section>

        <section className="checkout__block">
          <h2 className="h3"><em>03</em> Código de descuento</h2>
          <div className="promo">
            <Input name="promo_input" value={promo} onChange={(e) => { setPromo(e.target.value.toUpperCase()); setPct(0); setPromoMsg(null); }} placeholder="HOLA10" aria-label="Código de descuento" />
            <Btn type="button" variant="ghost" icon={false} loading={checking} onClick={applyPromo}>Aplicar</Btn>
          </div>
          {promoMsg ? <p className={`field-msg ${pct > 0 ? "field-msg--ok" : "field-msg--error"}`}>{promoMsg}</p> : null}
        </section>

        <label className="check check--dark">
          <input type="checkbox" name="terms" required />
          <span>Acepto los <a href="/terminos" target="_blank" rel="noopener">términos y condiciones</a> y la <a href="/privacidad" target="_blank" rel="noopener">política de privacidad</a>.</span>
        </label>
        {fe.terms ? <p className="field-msg field-msg--error">{fe.terms}</p> : null}
        {result.status === "error" && result.message ? <Banner tone="error">{result.message}</Banner> : null}
      </div>

      <aside className="checkout__aside">
        <h2 className="h3">Resumen</h2>
        <ul className="summary">
          {state.items.map((i) => (
            <li key={`${i.productId}${i.variant ?? ""}`}>
              <span className="summary__img">{i.image ? <Image src={i.image} alt="" width={64} height={64} /> : null}<b>{i.quantity}</b></span>
              <span className="summary__name">{i.name}<small>{[i.colorLabel, i.variant].filter(Boolean).join(" · ")}</small></span>
              <span className="summary__price">{formatCLP(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="totals">
          <div><dt>Subtotal</dt><dd>{formatCLP(subtotal)}</dd></div>
          {discount > 0 ? <div className="totals__off"><dt>Descuento {pct}%</dt><dd>−{formatCLP(discount)}</dd></div> : null}
          <div><dt>Despacho</dt><dd>{ship > 0 ? formatCLP(ship) : "Gratis"}</dd></div>
          <div className="totals__total"><dt>Total <small>IVA incluido</small></dt><dd>{formatCLP(total)}</dd></div>
        </dl>
        <Btn type="submit" size="lg" loading={pending} className="w-full">Confirmar pedido</Btn>
        <p className="muted">Al confirmar reservamos tus anteojos y te llevamos a pagar con Mercado Pago. No cobramos nada hasta ese paso.</p>
      </aside>
    </form>
  );
}
