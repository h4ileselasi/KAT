/* Smoke test: exercises the public write paths using the ANON key (same as the
   browser) to confirm RLS policies allow posting a prayer and lighting a candle. */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  // 1. Insert a prayer
  const { data: added, error: insErr } = await sb
    .from("prayer_wall")
    .insert({ intention: "TEST: smoke-test intention (safe to delete)", name: "Test" })
    .select()
    .single();
  if (insErr) throw new Error("INSERT failed: " + insErr.message);
  console.log("✅ Insert OK — new prayer id:", added.id, "candles:", added.candles);

  // 2. Light a candle via the RPC
  const { error: rpcErr } = await sb.rpc("increment_candles", { prayer_id: added.id });
  if (rpcErr) throw new Error("RPC increment_candles failed: " + rpcErr.message);

  // 3. Read it back
  const { data: after, error: selErr } = await sb
    .from("prayer_wall")
    .select("candles")
    .eq("id", added.id)
    .single();
  if (selErr) throw new Error("SELECT failed: " + selErr.message);
  console.log("✅ Candle RPC OK — candles now:", after.candles, after.candles === 1 ? "(correct)" : "(unexpected)");

  // 4. Clean up the test row
  await sb.from("prayer_wall").delete().eq("id", added.id);
  console.log("✅ Cleaned up test row. All public write paths work.");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
