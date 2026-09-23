"use client";
import { usePathname } from "next/navigation";
import { signOut } from "@/features/auth/actions";
import type { AppRole } from "@/lib/supabase/database.types";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/colecciones", label: "Colecciones" },
  { href: "/admin/descuentos", label: "Descuentos" },
  { href: "/admin/mercadopago", label: "Mercado Pago" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminNav({ role, email }: { role: AppRole; email: string }) {
  const path = usePathname();
  return (
    <aside className="anav">
      <a href="/" className="anav__brand"><img src="/assets/web/logo.png" alt="Allister Eyewear" width={140} height={54} /></a>
      <nav className="anav__links">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className={path === l.href || (l.href !== "/admin" && path.startsWith(l.href)) ? "is-on" : ""}>{l.label}</a>
        ))}
      </nav>
      <div className="anav__foot">
        <p><strong>{email}</strong><br /><small>{role}</small></p>
        <form action={signOut}><button type="submit" className="link-underline">Salir</button></form>
      </div>
    </aside>
  );
}
