/**
 * Applies supabase/schema.sql directly to the Postgres database.
 * Reads the connection string from DATABASE_URL in .env.local.
 *
 * Run:  node scripts/migrate.js
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Client } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "\n❌ DATABASE_URL is missing from .env.local.\n" +
      "   In Supabase click 'Connect' → copy the connection string (Session pooler),\n" +
      "   and add it to .env.local as:\n" +
      "   DATABASE_URL=postgresql://postgres.<ref>:<password>@...pooler.supabase.com:5432/postgres\n"
  );
  process.exit(1);
}

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "schema.sql"), "utf8");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  });

  console.log("→ Connecting to Supabase Postgres…");
  await client.connect();
  console.log("→ Applying schema.sql…");
  await client.query(sql);
  console.log("✅ Schema applied successfully.");

  // Quick verification: list the tables we expect.
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('prayer_wall','announcements','events','products','live_stream_config')
     ORDER BY table_name;`
  );
  console.log("→ Tables present:", rows.map((r) => r.table_name).join(", "));

  await client.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
