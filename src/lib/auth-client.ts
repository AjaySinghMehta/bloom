import { createClient, isBrowserAuthConfigured } from "./supabase-browser";

export interface AuthClient {
  sendMagicLink(email: string, redirectTo: string): Promise<{ error?: string }>;
  signOut(): Promise<void>;
}

class SupabaseAuthClient implements AuthClient {
  async sendMagicLink(email: string, redirectTo: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    return error ? { error: error.message } : {};
  }

  async signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
}

class LocalOnlyAuthClient implements AuthClient {
  async sendMagicLink() {
    return { error: "Authentication is not configured for this environment." };
  }

  async signOut() {}
}

export function getAuthClient(): AuthClient {
  return isBrowserAuthConfigured() ? new SupabaseAuthClient() : new LocalOnlyAuthClient();
}
