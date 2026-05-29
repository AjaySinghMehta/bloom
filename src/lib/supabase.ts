import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./app-config";

const supabaseUrl  = appConfig.supabase.url;
const supabaseAnon = appConfig.supabase.anonKey;

// We only create the client if credentials are actually set.
// When they're not (local dev without Supabase), all methods are no-ops
// and the app falls back to localStorage gracefully.
export const supabase =
  supabaseUrl && supabaseAnon
    ? createClient(supabaseUrl, supabaseAnon)
    : null;

export const isSupabaseEnabled = () => !!supabase;
