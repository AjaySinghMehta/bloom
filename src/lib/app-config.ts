export const appConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
  llm: {
    enabled: process.env.LLM_ENABLED === "true",
    baseUrl: process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1",
    apiKey: process.env.LLM_API_KEY ?? "",
    model: process.env.LLM_MODEL ?? "",
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 15000),
    maxInputChars: Number(process.env.LLM_MAX_INPUT_CHARS ?? 2500),
    maxOutputTokens: Number(process.env.LLM_MAX_OUTPUT_TOKENS ?? 250),
  },
};

export function isLlmConfigured() {
  return Boolean(appConfig.llm.enabled && appConfig.llm.baseUrl && appConfig.llm.apiKey && appConfig.llm.model);
}
