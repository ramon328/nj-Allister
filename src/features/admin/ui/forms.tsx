"use client";
import { useActionState, useState } from "react";
import { Banner, Btn, Field, Input, Select, Textarea } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/form-state";
import { formatCLP } from "@/lib/format";
import type { CollectionRow, OrderView, PromoCodeRow, ShopSettingsRow } from "@/lib/supabase/database.types";
import { deletePromo, saveCollection, savePromo, saveSettings, setProductStock } from "@/features/catalog/actions";
import { adminUpdateOrder, refundOrderPayment } from "@/features/orders/actions";
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from "@/features/orders/schemas";

export function AdminOrderForm({ order, superadmin }: { order: OrderView; superadmin: boolean }) {
  const [state, action, pending] = useActionState(adminUpdateOrder, initialFormState);
  const [refund, setRefund] = useState<FormState>(initialFormState);
  const options = [order.status, ...ORDER_TRANSITIONS[order.status]];
  return (
    <div className="aform aform--side">
      <form action={action} noValidate>
        <input type="hidden" name="id" value={order.id} />
        <Field label="Estado" name="status">
          <Select name="status" defaultValue={order.status}>{options.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s].label}</option>)}</Select>
        </Field>
        {order.status === "pending" ? <Field label="Despacho (CLP)" name="shipping_clp" hint="Se recalcula el total y el link de pago."><Input name="shipping_clp" type="number" min={0} defaultValue={order.shipping_clp} /></Field> : null}
        <Field label="N° de seguimiento" name="tracking" hint="Se incluye en el correo de envío."><Input name="tracking" defaultValue={order.tracking ?? ""} /></Field>
        <Field label="Notas internas" name="admin_notes"><Textarea name="admin_notes" rows={3} defaultValue={order.admin_notes ?? ""} /></Field>
        {state.status === "error" && state.message ? <Banner tone="error">{state.message}</Banner> : null}
        {state.status === "success" && state.message ? <Banner tone="success">{state.message}</Banner> : null}
        <Btn type="submit" loading={pending}>Guardar</Btn>
      </form>
      {superadmin && order.payment_id && order.payment_method === "mercadopago" && ["paid", "preparing", "cancelled"].includes(order.status) ? (
        <div className="aform__refund">
          <h3 className="h4">Reembolso Mercado Pago</h3>
          <p className="muted">Pago {order.payment_id} · {formatCLP(order.payment_amount_clp ?? order.total_clp)}</p>
          <Btn type="button" variant="ghost" onClick={async () => { if (confirm("¿Reembolsar el total en Mercado Pago?")) setRefund(await refundOrderPayment(order.id)); }}>Reembolsar total</Btn>
          {refund.message ? <Banner tone={refund.status === "success" ? "success" : "error"}>{refund.message}</Banner> : null}
        </div>
      ) : null}
    </div>
  );
}

export function CollectionForm({ c }: { c?: CollectionRow }) {
  const [state, action, pending] = useActionState(saveCollection, initialFormState);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="aform" noValidate>
      {c ? <input type="hidden" name="id" value={c.id} /> : null}
      <div className="aform__grid">
        <Field label="Nombre" name="name" error={fe.name}><Input name="name" defaultValue={c?.name ?? ""} required /></Field>
        <Field label="Slug" name="slug" error={fe.slug}><Input name="slug" defaultValue={c?.slug ?? ""} required /></Field>
        <Field label="Subtítulo" name="tagline" error={fe.tagline}><Input name="tagline" defaultValue={c?.tagline ?? ""} /></Field>
        <Field label="Etiqueta (ej. 40% OFF)" name="badge" error={fe.badge}><Input name="badge" defaultValue={c?.badge ?? ""} /></Field>
        <Field label="Imagen (URL)" name="image_url" error={fe.image_url}><Input name="image_url" defaultValue={c?.image_url ?? ""} /></Field>
        <Field label="Orden" name="sort" error={fe.sort}><Input name="sort" type="number" defaultValue={c?.sort ?? 0} /></Field>
      </div>
      <Field label="Descripción" name="description" error={fe.description}><Textarea name="description" rows={3} defaultValue={c?.description ?? ""} /></Field>
      <label className="check"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> <span>Visible</span></label>
      {state.message ? <Banner tone={state.status === "success" ? "success" : "error"}>{state.message}</Banner> : null}
      <Btn type="submit" loading={pending}>{c ? "Guardar" : "Crear colección"}</Btn>
    </form>
  );
}

export function SettingsForm({ s }: { s: ShopSettingsRow }) {
  const [state, action, pending] = useActionState(saveSettings, initialFormState);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="aform" noValidate>
      <div className="aform__grid">
        <Field label="Costo de despacho (CLP)" name="shipping_clp" error={fe.shipping_clp}><Input name="shipping_clp" type="number" min={0} defaultValue={s.shipping_clp} /></Field>
        <Field label="Envío gratis desde (CLP)" name="free_shipping_min_clp" error={fe.free_shipping_min_clp}><Input name="free_shipping_min_clp" type="number" min={0} defaultValue={s.free_shipping_min_clp} /></Field>
        <Field label="WhatsApp (solo números, con 56)" name="whatsapp" error={fe.whatsapp}><Input name="whatsapp" defaultValue={s.whatsapp ?? ""} /></Field>
      </div>
      <Field label="Barra de anuncios (una frase por línea)" name="announcement" error={fe.announcement}><Textarea name="announcement" rows={4} defaultValue={s.announcement.join("\n")} /></Field>
      {state.message ? <Banner tone={state.status === "success" ? "success" : "error"}>{state.message}</Banner> : null}
      <Btn type="submit" loading={pending}>Guardar</Btn>
    </form>
  );
}

export function PromoForm({ codes }: { codes: PromoCodeRow[] }) {
  const [state, action, pending] = useActionState(savePromo, initialFormState);
  const fe = state.fieldErrors ?? {};
  return (
    <div className="stack">
      <table className="atable">
        <thead><tr><th>Código</th><th>Descuento</th><th>Mínimo</th><th>Usos</th><th>Vence</th><th>Activo</th><th /></tr></thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.code}>
              <td><strong>{c.code}</strong></td><td>{c.discount_pct}%</td><td>{c.min_subtotal_clp ? formatCLP(c.min_subtotal_clp) : "—"}</td>
              <td>{c.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}</td><td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString("es-CL") : "—"}</td><td>{c.active ? "Sí" : "No"}</td>
              <td><button type="button" className="link-underline danger" onClick={() => { if (confirm(`¿Borrar ${c.code}?`)) deletePromo(c.code); }}>Borrar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action={action} className="aform" noValidate>
        <h3 className="h4">Nuevo código (o editar uno existente por su nombre)</h3>
        <div className="aform__grid">
          <Field label="Código" name="code" error={fe.code}><Input name="code" placeholder="VERANO20" required /></Field>
          <Field label="% descuento" name="discount_pct" error={fe.discount_pct}><Input name="discount_pct" type="number" min={1} max={90} defaultValue={10} /></Field>
          <Field label="Compra mínima (CLP)" name="min_subtotal_clp" error={fe.min_subtotal_clp}><Input name="min_subtotal_clp" type="number" min={0} defaultValue={0} /></Field>
          <Field label="Usos máximos" name="max_uses" hint="Vacío = ilimitado" error={fe.max_uses}><Input name="max_uses" type="number" min={1} /></Field>
          <Field label="Vence" name="expires_at" error={fe.expires_at}><Input name="expires_at" type="date" /></Field>
        </div>
        <label className="check"><input type="checkbox" name="active" defaultChecked /> <span>Activo</span></label>
        {state.message ? <Banner tone={state.status === "success" ? "success" : "error"}>{state.message}</Banner> : null}
        <Btn type="submit" loading={pending}>Guardar código</Btn>
      </form>
    </div>
  );
}

export function StockInline({ id, stock }: { id: string; stock: number }) {
  const [v, setV] = useState(stock);
  const [saving, setSaving] = useState(false);
  return (
    <span className="stockinline">
      <input type="number" min={0} value={v} onChange={(e) => setV(Number(e.target.value))} className="input input--sm" aria-label="Stock" />
      {v !== stock ? <button type="button" className="chip chip--sm is-on" disabled={saving} onClick={async () => { setSaving(true); await setProductStock(id, v); setSaving(false); }}>{saving ? "…" : "OK"}</button> : null}
    </span>
  );
}
