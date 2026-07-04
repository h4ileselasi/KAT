const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";

(async () => {
  // 1. login → capture cookie
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "StCatherine#2026" }),
  });
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  console.log("login:", login.status, "cookie:", cookie ? "got it" : "MISSING");

  // 2. upload the logo as a test image
  const buf = fs.readFileSync(path.join(__dirname, "..", "public", "brand", "logo.png"));
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "image/png" }), "test-upload.png");
  fd.append("folder", "test");

  const up = await fetch(`${BASE}/api/admin/upload`, { method: "POST", headers: { cookie }, body: fd });
  const body = await up.json();
  console.log("upload:", up.status, JSON.stringify(body));

  // 3. verify the returned public URL is reachable
  if (body.url) {
    const check = await fetch(body.url);
    console.log("public url reachable:", check.status, check.headers.get("content-type"));
  }

  // 4. unauthenticated upload should be blocked
  const noauth = await fetch(`${BASE}/api/admin/upload`, { method: "POST", body: new FormData() });
  console.log("unauthed upload (want 401):", noauth.status);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
