// Aplica supabase/migrations/*.sql en orden, una sola vez cada una.
// Uso: npm run db:migrate   (lee DATABASE_URL de .env.local o del entorno)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

export function loadEnv() {
  if (!existsSync(".env.local")) return {};
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
      }),
  );
}

export function dbClient() {
  const env = loadEnv();
  const url = process.env.DATABASE_URL ?? env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  // TLS verificado contra la CA raíz de Supabase (supabase/prod-ca-2021.crt).
  const ca = readFileSync(new URL("../supabase/prod-ca-2021.crt", import.meta.url), "utf8");
  return new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl: { ca, rejectUnauthorized: true } });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const client = dbClient();
  await client.connect();
  await client.query(`create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await client.query("select name from public._migrations")).rows.map((r) => r.name));
  const dir = "supabase/migrations";
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) { console.log("skip ", f); continue; }
    const sql = readFileSync(join(dir, f), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public._migrations (name) values ($1)", [f]);
      await client.query("commit");
      console.log("apply", f);
    } catch (e) {
      await client.query("rollback");
      console.error("FAIL ", f, "\n", e.message);
      process.exitCode = 1;
      break;
    }
  }
  await client.end();
}
