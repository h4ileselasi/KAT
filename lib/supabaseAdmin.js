import "server-only"; // build-time guard: importing this from client code errors
import { createClient } from "@supabase/supabase-js";

/* SERVER-ONLY Supabase client using the service-role key. It bypasses RLS, so
   it must NEVER reach the browser. The `server-only` import above makes Next.js
   fail the build if any client component tries to import this file — a safety
   net against leaking the service key. Import this only from Route Handlers
   (app/api/**) and server components. */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.NODE_ENV === "development" && !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local and restart the dev server."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || "", {
  auth: { autoRefreshToken: false, persistSession: false },
});
