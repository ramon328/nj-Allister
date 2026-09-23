// Variables públicas: seguras en el cliente. Las privadas solo en server/admin.
// Lectura perezosa: el build no cae si faltan; el error aparece al usarlas.
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export const publicEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  },
  get whatsapp() {
    return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56978792683";
  },
};
