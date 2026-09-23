import { createClient } from "@/lib/supabase/server";
import { PromoForm } from "@/features/admin/ui/forms";

export default async function PromosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
  return (
    <div className="stack">
      <h1 className="h2">Códigos de descuento</h1>
      <PromoForm codes={data ?? []} />
    </div>
  );
}
