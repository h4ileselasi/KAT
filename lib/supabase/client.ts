import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client — session-aware (auth cookies shared with the server).
// Reuse a single instance across the app.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabase = createClient();
