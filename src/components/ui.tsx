"use client";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/format";

export const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "light" | "ghost"; loading?: boolean; icon?: boolean; size?: "md" | "lg" | "sm" };

/** Botón isla: píldora con icono anidado. */
export function Btn({ variant = "dark", loading, icon = true, size = "md", className, children, disabled, ...rest }: BtnProps) {
  return (
    <button className={cn("btn", `btn--${variant}`, size !== "md" && `btn--${size}`, loading && "is-loading", className)} disabled={disabled || loading} {...rest}>
      <span>{children}</span>
      {icon ? <i className="btn__icon">{loading ? <span className="spinner" aria-hidden="true" /> : <ArrowIcon />}</i> : null}
    </button>
  );
}

export function Field({ label, name, hint, error, children, className }: { label: string; name: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("field-group", error && "has-error", className)}>
      <label htmlFor={name} className="field-label">{label}</label>
      {children}
      {error ? <p className="field-msg field-msg--error" role="alert">{error}</p> : hint ? <p className="field-msg">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input id={rest.name} className={cn("input", error && "is-invalid", className)} aria-invalid={Boolean(error)} {...rest} />;
}
export function Textarea({ className, error, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <textarea id={rest.name} className={cn("input input--area", error && "is-invalid", className)} aria-invalid={Boolean(error)} {...rest} />;
}
export function Select({ className, error, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return <select id={rest.name} className={cn("input input--select", error && "is-invalid", className)} aria-invalid={Boolean(error)} {...rest}>{children}</select>;
}

export function Banner({ tone = "info", children }: { tone?: "info" | "success" | "error" | "warn"; children: ReactNode }) {
  return <div className={cn("banner", `banner--${tone}`)} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "ok" | "warn" | "bad" | "info" | "accent"; children: ReactNode }) {
  return <span className={cn("tag", `tag--${tone}`)}>{children}</span>;
}
