"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clientIp } from "@/lib/auth/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/lib/form-state";

const input = z.object({ number: z.coerce.number().int().positive(), email: z.string().trim().toLowerCase().email("Correo inválido") });

/** "Seguir mi pedido": número + correo. Limitado por IP y con respuesta genérica. */
export async function findOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = input.safeParse({ number: formData.get("number"), email: formData.get("email") });
  if (!parsed.success) return { status: "error", message: "Revisa el número de pedido y el correo." };
  const { number, email } = parsed.data;
  const admin = createAdminClient();
  const ip = await clientIp();
  const { data: ok } = await admin.rpc("rate_allow", { p_key: `track:${ip}`, p_max: 20, p_window_min: 60, p_max_day: 5000 });
  if (ok !== true) return { status: "error", message: "Demasiados intentos. Prueba en unos minutos." };
  const { data: order } = await admin.from("orders").select("id, guest_email, guest_token").eq("number", number).maybeSingle();
  if (!order || order.guest_email.toLowerCase() !== email) return { status: "error", message: "No encontramos un pedido con ese número y correo." };
  redirect(`/pedido/${order.id}?k=${order.guest_token}`);
}
