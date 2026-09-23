"use client";
import { useActionState } from "react";
import { Banner, Btn, Field, Input } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";
import { signInWithPassword } from "../actions";

export function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, initialFormState);
  return (
    <form action={action} className="login" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
      <Field label="Correo" name="email" error={state.fieldErrors?.email}><Input name="email" type="email" autoComplete="email" inputMode="email" required error={state.fieldErrors?.email} /></Field>
      <Field label="Contraseña" name="password" error={state.fieldErrors?.password}><Input name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} /></Field>
      {error === "sin-acceso" ? <Banner tone="error">Tu cuenta no tiene acceso al panel.</Banner> : null}
      {state.status === "error" && state.message ? <Banner tone="error">{state.message}</Banner> : null}
      <Btn type="submit" loading={pending} className="w-full">Entrar</Btn>
    </form>
  );
}
