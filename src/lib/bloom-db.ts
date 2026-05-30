import { createClient as createBrowserSupabaseClient, isBrowserAuthConfigured } from "./supabase-browser";
import {
  type BloomJourney,
  type DayLog,
  type RemoteJourneySync,
  createEmptyDayLog,
  normalizeBloomJourney,
} from "./bloom-types";

export const KEY = "bloom_data";
const LEGACY_KEY = "unaddiction_data";

export const HABIT_ACTION: Record<string, string> = {
  smoking: "I Smoked",
  drinking: "I Had a Drink",
  sugar: "I Ate Sugar",
  digital: "I Used Screens",
};

export const HABIT_LOG_LABEL: Record<string, string> = {
  smoking: "Log Smoking",
  drinking: "Log Drinking",
  sugar: "Log Sugar",
  digital: "Log Screen Time",
};

export function getDailyTarget(baseQuantity: number, dayNum: number): number {
  const totalDays = 28;
  const normalizedDay = Math.min(Math.max(dayNum, 1), totalDays);
  const remainingRatio = (totalDays - normalizedDay) / (totalDays - 1);
  return Math.max(0, Math.ceil(baseQuantity * remainingRatio));
}

export function loadBloom(): BloomJourney | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;

  try {
    return normalizeBloomJourney(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveBloom(data: BloomJourney): void {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("bloom_update"));
  activeRemoteSync.sync(data).catch(() => {
    // Silently handle sync failures to prevent console clutter
  });
}

export function clearBloom(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(LEGACY_KEY);
  window.dispatchEvent(new Event("bloom_update"));
}

export function getLocalISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return getLocalISODate();
}

export function getDaysSince(startDateStr: string): number {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now.getTime() - start.getTime()) / 86400000));
}

export function getOrInitDay(data: BloomJourney, dateKey: string): DayLog {
  data.logs ??= {};
  data.logs[dateKey] ??= createEmptyDayLog();
  return data.logs[dateKey];
}

export function getTodayCount(data: BloomJourney, dateKey: string): number {
  return (data.logs?.[dateKey]?.usages ?? []).reduce((sum, usage) => sum + (usage.amount ?? 0), 0);
}

export async function syncJourneyToSupabase(data: BloomJourney): Promise<void> {
  return supabaseJourneySync.sync(data);
}

export const supabaseJourneySync: RemoteJourneySync = {
  async healthCheck() {
    if (!isBrowserAuthConfigured()) return { ok: false, error: "Supabase env vars are not configured." };
    const browserSupabase = createBrowserSupabaseClient();
    const { error } = await browserSupabase.from("bloom_journeys").select("id").limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Supabase connected. bloom_journeys table is accessible." };
  },

  async sync(data) {
    if (typeof window === "undefined") return;
    if (!isBrowserAuthConfigured()) return;

    // Queue the latest data payload to prevent race conditions during rapid tapping.
    pendingSyncData = data;
    if (isSyncing) return;
    isSyncing = true;

    while (pendingSyncData) {
      const currentData = pendingSyncData;
      pendingSyncData = null;

      const browserSupabase = createBrowserSupabaseClient();
      const deviceId = currentData.deviceId ?? getOrCreateDeviceId(currentData);

      try {
        const {
          data: { user },
          error: userError,
        } = await browserSupabase.auth.getUser();

        if (userError) throw userError;
        if (!user) continue;

        const { data: journey, error: journeyError } = await browserSupabase
        .from("bloom_journeys")
        .upsert(
          {
            user_id: user.id,
            device_id: deviceId,
            habit: currentData.habit,
            quantity: currentData.quantity,
            unit: currentData.unit,
            trigger: currentData.trigger,
            wake_time: currentData.wakeTime,
            sleep_time: currentData.sleepTime,
            drink_type: currentData.drinkType ?? null,
            start_date: currentData.startDate,
            current_streak: currentData.currentStreak ?? 0,
            longest_streak: currentData.longestStreak ?? 0,
            last_completed_date: currentData.lastCompletedDate ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "device_id" },
        )
        .select("id,user_id")
        .single();

      if (journeyError) throw journeyError;
      if (!journey) throw new Error("Journey upsert did not return a row.");

      for (const [dateKey, log] of Object.entries(currentData.logs ?? {})) {
        const { error: dayStatusError } = await browserSupabase.from("bloom_day_status").upsert(
          {
            journey_id: journey.id,
            log_date: dateKey,
            checked_in: log.checkedIn ?? false,
            checked_out: log.checkedOut ?? false,
          },
          { onConflict: "journey_id,log_date" },
        );

        if (dayStatusError) {
          throw dayStatusError;
        }

        for (const craving of log.cravings ?? []) {
          const cravingPayload = {
            journey_id: journey.id,
            log_date: dateKey,
            hour: craving.hour,
            minute: craving.minute,
            logged_at: new Date(craving.timestamp).toISOString(),
          };
          const { error: cravingError } = await browserSupabase.from("bloom_cravings").upsert(
            cravingPayload,
            { onConflict: "journey_id,logged_at" },
          );

          if (cravingError) throw cravingError;
        }

        for (const usage of log.usages ?? []) {
          const usagePayload = {
            journey_id: journey.id,
            log_date: dateKey,
            amount: usage.amount,
            logged_at: new Date(usage.timestamp).toISOString(),
          };
          const { error: usageError } = await browserSupabase.from("bloom_usage_logs").upsert(
            usagePayload,
            { onConflict: "journey_id,logged_at" },
          );

          if (usageError) throw usageError;
        }
      }
      } catch (error) {
        // Silently capture sync loop errors to prevent console warnings
      }
    }
    isSyncing = false;
  },
};

let isSyncing = false;
let pendingSyncData: BloomJourney | null = null;

const activeRemoteSync: RemoteJourneySync = supabaseJourneySync;

function getOrCreateDeviceId(data: BloomJourney): string {
  if (data.deviceId) return data.deviceId;
  const id = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  data.deviceId = id;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  return id;
}
