/** Verifies the live-session migration landed. Run: node scripts/verify-live-schema.js */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const cols = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'live_stream_config'
       AND column_name IN ('session_started_at','youtube_playlist_id','schedule')`
  );
  const pub = await client.query(
    `SELECT tablename FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND tablename IN ('chat_messages','live_stream_config')`
  );
  console.log("columns:", cols.rows.map((r) => r.column_name).sort().join(", "));
  console.log("realtime:", pub.rows.map((r) => r.tablename).sort().join(", "));
  const ok = cols.rows.length === 3 && pub.rows.length === 2;
  console.log(ok ? "✅ live-session schema OK" : "❌ MISSING PIECES");
  await client.end();
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
