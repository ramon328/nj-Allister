import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, ProfileRow } from "@/lib/supabase/database.types";

export type SessionProfile = Pick<ProfileRow, "id" | "email" | "full_name" | "role" | "disabled">;
const COLS = "id, email, full_name, role, disabled";
const ADMIN_ROLES: AppRole[] = ["admin", "superadmin"];

// Usuario verificado contra Auth (getUser, no getSession) + su perfil. Memoizado por request.
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select(COLS).eq("id", user.id).maybeSingle();
  return data ?? null;
});

export function hasRole(profile: SessionProfile | null, roles: AppRole[]): profile is SessionProfile {
  return !!profile && !profile.disabled && roles.includes(profile.role);
}

export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!hasRole(profile, ADMIN_ROLES)) redirect("/login?error=sin-acceso");
  return profile;
}

export async function requireSuperadmin(): Promise<SessionProfile> {
  const profile = await requireAdmin();
  if (profile.role !== "superadmin") redirect("/admin");
  return profile;
}

// Para server actions: lanza en vez de redirigir (defensa en profundidad además de RLS).
export async function assertAdmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!hasRole(profile, ADMIN_ROLES)) throw new Error("forbidden");
  return profile;
}
export async function assertSuperadmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!hasRole(profile, ["superadmin"])) throw new Error("forbidden");
  return profile;
}
