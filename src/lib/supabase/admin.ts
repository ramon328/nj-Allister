import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

// Cliente service_role: salta RLS. Solo en servidor (pedidos de invitado, webhooks, cron).
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createSupabaseClient<Database>(publicEnv.supabaseUrl, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
