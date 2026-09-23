import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { AdminNav } from "@/features/admin/ui/admin-nav";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireAdmin();
  return (
    <div className="admin">
      <AdminNav role={profile.role} email={profile.email} />
      <main className="admin__main">{children}</main>
    </div>
  );
}
