import "server-only";
import { appConfig, isLlmConfigured } from "./app-config";

type ChatRole = "system" | "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export interface HabitCoachInput {
  habit: string;
  trigger: string;
  currentCount: number;
  target: number;
  cravingNote?: string;
}

export interface HabitCoachResult {
  enabled: boolean;
  text: string;
}

export async function generateHabitCoachResponse(input: HabitCoachInput): Promise<HabitCoachResult> {
  if (!isLlmConfigured()) {
    return {
      enabled: false,
      text: "Pause for five minutes, drink water, change rooms, and log the urge honestly.",
    };
  }

  const note = (input.cravingNote ?? "").slice(0, appConfig.llm.maxInputChars);
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are Bloom's habit-change coach. Give safe, practical, non-medical coping advice in 2-4 short sentences. Do not diagnose, shame, or claim guaranteed results. For emergencies or severe withdrawal, advise professional help.",
    },
    {
      role: "user",
      content: `Habit: ${input.habit}\nTrigger: ${input.trigger}\nToday: ${input.currentCount}/${input.target}\nUser note: ${note || "none"}`,
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.llm.timeoutMs);

  try {
    const response = await fetch(`${appConfig.llm.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appConfig.llm.apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Bloom",
      },
      body: JSON.stringify({
        model: appConfig.llm.model,
        messages,
        temperature: 0.4,
        max_tokens: appConfig.llm.maxOutputTokens,
      }),
    });

    const body = (await response.json()) as ChatCompletionResponse;
    if (!response.ok) {
      throw new Error(body.error?.message ?? "LLM request failed.");
    }

    return {
      enabled: true,
      text: body.choices?.[0]?.message?.content?.trim() || "Take one small pause, breathe slowly, and choose the next healthy action.",
    };
  } catch {
    return {
      enabled: true,
      text: "The coach is unavailable right now. Use the five-minute pause: breathe, drink water, move your body, then log what happened.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
