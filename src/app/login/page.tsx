import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/ui/login-form";
import { getSessionProfile, hasRole } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/tokens";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };
type SP = Record<string, string | string[] | undefined>;

export default async function LoginPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  const profile = await getSessionProfile();
  if (hasRole(profile, ["admin", "superadmin"])) redirect(next);
  return (
    <main className="auth">
      <div className="auth__card">
        <img src="/assets/web/logo.png" alt="Allister Eyewear" width={160} height={62} />
        <h1 className="h3">Panel de administración</h1>
        <LoginForm next={next} error={typeof sp.error === "string" ? sp.error : undefined} />
        <a href="/" className="link-underline">Volver a la tienda</a>
      </div>
    </main>
  );
}
