"use client";
import { useActionState } from "react";
import { Banner, Btn, Field, Input } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";
import { findOrder } from "../track-actions";

export function TrackOrderForm() {
  const [state, action, pending] = useActionState(findOrder, initialFormState);
  return (
    <form action={action} className="track" noValidate>
      <div className="grid-2">
        <Field label="Número de pedido" name="number"><Input name="number" inputMode="numeric" placeholder="1024" required /></Field>
        <Field label="Correo de la compra" name="email"><Input name="email" type="email" inputMode="email" placeholder="tu@correo.cl" required /></Field>
      </div>
      {state.status === "error" && state.message ? <Banner tone="error">{state.message}</Banner> : null}
      <Btn type="submit" loading={pending}>Ver mi pedido</Btn>
    </form>
  );
}
