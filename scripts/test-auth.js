const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const email = `test-${Date.now()}@example.com`;
const password = "Test123456!";

(async () => {
  // 1. create a confirmed test user (as admin)
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: "Test Parishioner" },
  });
  if (cErr) throw new Error("createUser: " + cErr.message);
  console.log("✓ user created:", created.user.id);

  // 2. sign in with the anon client (what the browser does)
  const { data: signin, error: sErr } = await anon.auth.signInWithPassword({ email, password });
  if (sErr) throw new Error("signIn: " + sErr.message);
  console.log("✓ sign-in OK · session:", signin.session ? "yes" : "no", "· name:", signin.user.user_metadata.full_name);

  // 3. read the user back
  const { data: got } = await anon.auth.getUser(signin.session.access_token);
  console.log("✓ getUser:", got.user?.email);

  // 4. cleanup
  await admin.auth.admin.deleteUser(created.user.id);
  console.log("✓ test user deleted — auth pipeline works");
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
