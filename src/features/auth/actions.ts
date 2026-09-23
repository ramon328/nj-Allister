"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, safeNext } from "@/lib/auth/tokens";
import { flatten, type FormState } from "@/lib/form-state";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  next: z.string().optional(),
  website: z.string().max(0).optional(), // honeypot
});

export async function signInWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: flatten(parsed.error) };
  const ip = await clientIp();
  const { data: ok } = await createAdminClient().rpc("rate_allow", { p_key: `login:${ip}`, p_max: 10, p_window_min: 10, p_max_day: 2000 });
  if (ok !== true) return { status: "error", message: "Demasiados intentos. Espera unos minutos." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { status: "error", message: "Correo o contraseña incorrectos." };
  redirect(safeNext(parsed.data.next));
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
