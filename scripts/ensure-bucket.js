const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "images");
  if (exists) {
    console.log("✓ 'images' bucket already exists");
    // ensure it's public
    await admin.storage.updateBucket("images", { public: true });
    console.log("✓ ensured public");
  } else {
    const { error } = await admin.storage.createBucket("images", {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    });
    if (error) throw error;
    console.log("✓ created public 'images' bucket");
  }
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
