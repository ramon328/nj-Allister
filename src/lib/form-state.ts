import type { z } from "zod";

export type FieldErrors = Record<string, string | undefined>;
export type FormState = { status: "idle" | "error" | "success"; message?: string; fieldErrors?: FieldErrors };
export const initialFormState: FormState = { status: "idle" };

/** Primer error por campo, en español ya que los mensajes vienen del schema. */
export function flatten(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
