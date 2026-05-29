import { createClient as createBrowserSupabaseClient, isBrowserAuthConfigured } from "./supabase-browser";
import { supabase } from "./supabase";
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
  console.debug("[Bloom][Save] saveBloom", {
    deviceId: data.deviceId ?? null,
    logDates: Object.keys(data.logs ?? {}),
    totalCravings: Object.values(data.logs ?? {}).reduce((sum, log) => sum + (log.cravings?.length ?? 0), 0),
  });
  activeRemoteSync.sync(data).catch((error) => {
    console.error("[Bloom][Save] Remote sync failed", error);
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
    if (!supabase) return { ok: false, error: "Supabase env vars are not configured." };
    const { error } = await supabase.from("bloom_journeys").select("id").limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Supabase connected. bloom_journeys table is accessible." };
  },

  async sync(data) {
    if (typeof window === "undefined") return;
    if (!isBrowserAuthConfigured()) {
      console.warn("[Bloom][Sync] Browser auth is not configured. Skipping remote sync.");
      return;
    }

    const browserSupabase = createBrowserSupabaseClient();
    const deviceId = data.deviceId ?? getOrCreateDeviceId(data);

    try {
      const {
        data: { user },
        error: userError,
      } = await browserSupabase.auth.getUser();

      console.debug("[Bloom][Sync] Authenticated user lookup", {
        deviceId,
        userId: user?.id ?? null,
        userError: userError?.message ?? null,
      });

      if (userError) {
        throw userError;
      }

      if (!user) {
        console.warn("[Bloom][Sync] No authenticated user session. Keeping local data only.", {
          deviceId,
        });
        return;
      }

      const { data: journey, error: journeyError } = await browserSupabase
        .from("bloom_journeys")
        .upsert(
          {
            user_id: user.id,
            device_id: deviceId,
            habit: data.habit,
            quantity: data.quantity,
            unit: data.unit,
            trigger: data.trigger,
            wake_time: data.wakeTime,
            sleep_time: data.sleepTime,
            drink_type: data.drinkType ?? null,
            start_date: data.startDate,
            current_streak: data.currentStreak ?? 0,
            longest_streak: data.longestStreak ?? 0,
            last_completed_date: data.lastCompletedDate ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "device_id" },
        )
        .select("id,user_id")
        .single();

      console.debug("[Bloom][Sync] Journey upsert", {
        journeyId: journey?.id ?? null,
        journeyUserId: journey?.user_id ?? null,
        error: journeyError?.message ?? null,
      });

      if (journeyError) {
        throw journeyError;
      }

      if (!journey) {
        throw new Error("Journey upsert did not return a row.");
      }

      for (const [dateKey, log] of Object.entries(data.logs ?? {})) {
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
          console.debug("[Bloom][Sync] Craving upsert", cravingPayload);
          const { error: cravingError } = await browserSupabase.from("bloom_cravings").upsert(
            cravingPayload,
            { onConflict: "journey_id,logged_at" },
          );

          if (cravingError) {
            console.error("[Bloom][Sync] Craving upsert failed", {
              ...cravingPayload,
              error: cravingError.message,
            });
            throw cravingError;
          }
        }

        for (const usage of log.usages ?? []) {
          const usagePayload = {
            journey_id: journey.id,
            log_date: dateKey,
            amount: usage.amount,
            logged_at: new Date(usage.timestamp).toISOString(),
          };
          console.debug("[Bloom][Sync] Usage upsert", usagePayload);
          const { error: usageError } = await browserSupabase.from("bloom_usage_logs").upsert(
            usagePayload,
            { onConflict: "journey_id,logged_at" },
          );

          if (usageError) {
            console.error("[Bloom][Sync] Usage upsert failed", {
              ...usagePayload,
              error: usageError.message,
            });
            throw usageError;
          }
        }
      }

      console.debug("[Bloom][Sync] Sync completed", {
        deviceId,
        userId: user.id,
        totalLogDates: Object.keys(data.logs ?? {}).length,
      });
    } catch (error) {
      console.error("[Bloom][Sync] Sync failed", error);
      throw error;
    }
  },
};

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
