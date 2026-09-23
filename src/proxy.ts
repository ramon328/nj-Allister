import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * 1) Modo "Próximamente" en producción pública (COMING_SOON=1): todo el sitio
 *    muestra la página de espera, salvo panel, login, webhooks y cron.
 * 2) Refresco de sesión Supabase. 3) Gate de /admin: sin sesión → /login.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const passthrough = pathname.startsWith("/auth/") || pathname.startsWith("/api/webhooks/") || pathname.startsWith("/api/cron/");
  if (passthrough) return NextResponse.next();

  if (process.env.COMING_SOON === "1") {
    const allowed = pathname === "/proximamente" || pathname.startsWith("/admin") || pathname === "/login" || pathname.startsWith("/api/");
    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/proximamente";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("[proxy] faltan variables de entorno:", missing.join(", "));
    return new NextResponse("Sitio en mantenimiento. Vuelve en unos minutos.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  }

  const requestHeaders = new Headers(request.headers);
  const { response, claims } = await updateSession(request, requestHeaders);
  if (pathname.startsWith("/admin") && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|woff2)$).*)"],
};
