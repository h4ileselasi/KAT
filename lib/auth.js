import crypto from "crypto";
import { cookies } from "next/headers";

/* Lightweight single-admin auth for the parish panel. On correct password we
   set an httpOnly cookie whose value is an HMAC of a fixed payload with
   ADMIN_SECRET. Nobody can forge it without the secret, and it carries no
   sensitive data. Good enough for one trusted admin; swap for Supabase Auth
   if you ever need multiple roles. */

const COOKIE = "stc_admin";
const PAYLOAD = "stc-admin-v1";

function secret() {
  return process.env.ADMIN_SECRET || "dev-only-insecure-secret";
}

export function makeToken() {
  return crypto.createHmac("sha256", secret()).update(PAYLOAD).digest("hex");
}

export function verifyToken(token) {
  if (!token) return false;
  const expected = makeToken();
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false; // length mismatch etc.
  }
}

// Server-side: is the current request authenticated? (reads the cookie)
export async function isAuthed() {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

export const ADMIN_COOKIE = COOKIE;
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours
