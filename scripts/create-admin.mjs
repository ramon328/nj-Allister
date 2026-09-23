// Crea (o actualiza la contraseña de) un usuario admin en Supabase Auth.
// Uso: npm run admin:create -- correo@dominio.cl [contraseña]
// Sin contraseña genera una aleatoria y la imprime una sola vez.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, dbClient } from "./db-migrate.mjs";

const env = { ...loadEnv(), ...process.env };
const [email, given] = process.argv.slice(2);
if (!email) { console.error("uso: npm run admin:create -- correo [contraseña]"); process.exit(1); }
const password = given ?? randomBytes(12).toString("base64url");

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
let userId;
if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
  if (error) throw error;
  userId = existing.id;
  console.log("usuario existente, contraseña actualizada");
} else {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Allister" } });
  if (error) throw error;
  userId = data.user.id;
  console.log("usuario creado");
}
// Asegura rol admin aunque el correo no esté en bootstrap_superadmins.
const db = dbClient();
await db.connect();
await db.query(
  `insert into public.profiles (id, email, role) values ($1, $2, 'superadmin')
   on conflict (id) do update set role = case when public.profiles.role = 'superadmin' then 'superadmin' else 'admin' end::public.app_role, disabled = false`,
  [userId, email],
);
await db.end();
console.log(`\nAdmin listo\n  correo:     ${email}\n  contraseña: ${password}\n  panel:      /admin\n`);
