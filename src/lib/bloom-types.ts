export type HabitId = "smoking" | "drinking" | "sugar" | "digital";

export type TriggerId = "Stress" | "Social" | "Boredom" | "Routine";

export interface CravingLog {
  timestamp: number;
  hour: number;
  minute: number;
}

export interface UsageLog {
  timestamp: number;
  amount: number;
}

export interface DayLog {
  cravings: CravingLog[];
  usages: UsageLog[];
  checkedIn: boolean;
  checkedOut: boolean;
}

export interface BloomJourney {
  deviceId?: string;
  habit: HabitId;
  quantity: number;
  unit: string;
  trigger: TriggerId | string;
  wakeTime: string;
  sleepTime: string;
  drinkType?: string;
  startDate: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  logs: Record<string, DayLog>;
}

export interface JourneyRepository {
  load(): BloomJourney | null;
  save(data: BloomJourney): void;
  clear(): void;
}

export interface RemoteJourneySync {
  sync(data: BloomJourney): Promise<void>;
  healthCheck(): Promise<{ ok: true; message: string } | { ok: false; error: string }>;
}

export function createEmptyDayLog(): DayLog {
  return { cravings: [], usages: [], checkedIn: false, checkedOut: false };
}

export function isBloomJourney(value: unknown): value is BloomJourney {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BloomJourney>;
  return (
    typeof candidate.habit === "string" &&
    typeof candidate.quantity === "number" &&
    typeof candidate.unit === "string" &&
    typeof candidate.startDate === "string"
  );
}

export function normalizeBloomJourney(value: unknown): BloomJourney | null {
  if (!isBloomJourney(value)) return null;
  return {
    ...value,
    currentStreak: value.currentStreak ?? 0,
    longestStreak: value.longestStreak ?? 0,
    lastCompletedDate: value.lastCompletedDate ?? null,
    logs: value.logs ?? {},
    wakeTime: value.wakeTime ?? "07:00",
    sleepTime: value.sleepTime ?? "23:00",
    trigger: value.trigger ?? "",
  };
}
