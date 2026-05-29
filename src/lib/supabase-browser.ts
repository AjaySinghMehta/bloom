import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components (browser)
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase browser client requested, but Supabase env vars are not configured.");
  }

  return createBrowserClient(
    url,
    key
  );
}

export function isBrowserAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
