import { getSettings } from "@/features/catalog/queries";
import { SettingsForm } from "@/features/admin/ui/forms";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div className="stack">
      <h1 className="h2">Configuración</h1>
      <SettingsForm s={s} />
    </div>
  );
}
