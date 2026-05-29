"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { clearBloom, getDaysSince, loadBloom, saveBloom } from "@/lib/bloom-db";
import type { BloomJourney, CravingLog } from "@/lib/bloom-types";

const HABIT_LABELS: Record<string, string> = {
  smoking: "Smoking", drinking: "Drinking", sugar: "Sugar", digital: "Digital Habits",
};
const TRIGGER_LABELS: Record<string, { label: string; emoji: string }> = {
  Stress:  { label: "Stress & Anxiety",  emoji: "😤" },
  Social:  { label: "Social Situations", emoji: "👥" },
  Boredom: { label: "Boredom",           emoji: "😴" },
  Routine: { label: "Daily Routine",     emoji: "🔄" },
};

function StatCard({ emoji, value, label, sub, color }: { emoji: string; value: string | number; label: string; sub?: string; color: string }) {
  return (
    <div style={{ background: "white", border: "2px solid #eeeeee", borderRadius: "18px", padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>{emoji}</div>
      <div>
        <div style={{ fontSize: "28px", fontWeight: "900", color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#4b4b4b", marginTop: "4px" }}>{label}</div>
        {sub && <div style={{ fontSize: "11px", color: "#afafaf", marginTop: "2px" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const initialData = loadBloom();
  const [data,    setData]    = useState<BloomJourney | null>(initialData);
  const [editing, setEditing] = useState(false);
  const [wake,    setWake]    = useState(initialData?.wakeTime ?? "07:00");
  const [sleep,   setSleep]   = useState(initialData?.sleepTime ?? "23:00");
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    const d = data;
    if (!d) { router.push("/setup"); return; }

    const refresh = () => {
      const fresh = loadBloom();
      if (fresh) setData(fresh);
    };
    window.addEventListener("bloom_update", refresh);
    return () => window.removeEventListener("bloom_update", refresh);
  }, [data, router]);

  if (!data) return null;

  const daysSince   = getDaysSince(data.startDate);
  const streak      = data.currentStreak ?? 0;
  const allLogs     = Object.entries(data.logs ?? {}).sort(([a], [b]) => b.localeCompare(a));
  const totalCravings = allLogs.reduce((s, [, l]) => s + (l.cravings?.length ?? 0), 0);
  const totalDays   = allLogs.filter(([, l]) => l.checkedOut).length;

  // Craving pattern: which hours had most cravings
  const hourCount: Record<number, number> = {};
  allLogs.forEach(([, log]) => (log.cravings ?? []).forEach((craving: CravingLog) => { hourCount[craving.hour] = (hourCount[craving.hour] ?? 0) + 1; }));
  const peakHour = Object.entries(hourCount).sort(([,a],[,b]) => b - a)[0];

  const saveSettings = () => {
    const d = loadBloom();
    if (!d) return;
    d.wakeTime  = wake;
    d.sleepTime = sleep;
    saveBloom(d);
    setData(d);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetJourney = () => {
    if (!confirm("Are you sure? This will erase all your progress and logs.")) return;
    clearBloom();
    router.push("/setup");
  };

  const trigger = TRIGGER_LABELS[data.trigger] ?? { label: data.trigger, emoji: "❓" };

  const fmtHour = (h: number) => `${h === 0 ? 12 : h > 12 ? h - 12 : h}:00 ${h >= 12 ? "PM" : "AM"}`;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "white", display: "flex" }}>
      <AppSidebar activeNav="PROFILE" />

      <section style={{ flex: 1, marginLeft: "248px", padding: "48px 40px", backgroundColor: "#fdfdfd", minHeight: "100vh" }}>
        <div style={{ maxWidth: "800px" }}>

          {/* Header */}
          <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>YOUR PROFILE</div>
              <h1 style={{ fontSize: "36px", fontWeight: "900" }}>Journey Stats</h1>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setEditing(!editing)} style={{ padding: "10px 20px", borderRadius: "12px", border: "2px solid #eeeeee", background: "white", fontWeight: "700", fontSize: "13px", cursor: "pointer", color: editing ? "#1cb0f6" : "#4b4b4b" }}>
                {editing ? "✕ Cancel" : "⚙ Settings"}
              </button>
            </div>
          </div>

          {/* Habit Profile Card */}
          <div style={{ background: "white", border: "2px solid #eeeeee", borderRadius: "20px", padding: "28px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "24px" }}>
            <img src={`/icon_${data.habit}.png`} alt={data.habit} style={{ width: "80px", height: "80px", objectFit: "contain" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>CONQUERING</div>
              <h2 style={{ fontSize: "26px", fontWeight: "900" }}>{HABIT_LABELS[data.habit] ?? data.habit}</h2>
              <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
                <div style={{ fontSize: "13px", color: "#afafaf" }}>Baseline: <strong style={{ color: "#4b4b4b" }}>{data.quantity} {data.unit}/day</strong></div>
                <div style={{ fontSize: "13px", color: "#afafaf" }}>Trigger: <strong style={{ color: "#4b4b4b" }}>{trigger.emoji} {trigger.label}</strong></div>
                {data.drinkType && <div style={{ fontSize: "13px", color: "#afafaf" }}>Type: <strong style={{ color: "#4b4b4b" }}>{data.drinkType}</strong></div>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#afafaf", marginBottom: "4px" }}>STARTED</div>
              <div style={{ fontWeight: "800", fontSize: "14px" }}>{new Date(data.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
              <div style={{ fontSize: "12px", color: "#58cc02", marginTop: "4px" }}>Day {daysSince + 1}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <StatCard emoji="🔥" value={streak}      label="Current Streak" sub={`Best: ${data.longestStreak ?? 0} days`} color="#ffc107" />
            <StatCard emoji="✅" value={totalDays}   label="Days Completed"  sub="with check-out"                         color="#58cc02" />
            <StatCard emoji="⚡" value={totalCravings} label="Cravings Tracked" sub="every one you logged counts"         color="#ff9600" />
            <StatCard emoji="📅" value={daysSince + 1} label="Days Since Start" sub="keep going"                         color="#a855f7" />
          </div>

          {/* Peak Craving Hour */}
          {peakHour && (
            <div style={{ background: "#fff8e1", border: "2px solid #ffe082", borderRadius: "18px", padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ fontSize: "36px" }}>⚡</div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13px", color: "#c99700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>PEAK CRAVING TIME</div>
                <div style={{ fontWeight: "900", fontSize: "24px", color: "#775a00" }}>{fmtHour(Number(peakHour[0]))}</div>
                <div style={{ fontSize: "13px", color: "#afafaf" }}>{peakHour[1]} cravings logged at this hour — we'll intercept it next time.</div>
              </div>
            </div>
          )}

          {/* Settings Editor */}
          {editing && (
            <div style={{ background: "white", border: "2px solid #1cb0f6", borderRadius: "20px", padding: "28px", marginBottom: "24px", animation: "fadeInUp 0.3s ease-out" }}>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#1cb0f6", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>⚙ Update Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>🌅 Wake-up time</label>
                  <input type="time" value={wake} onChange={e => setWake(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #eeeeee", fontSize: "16px", fontWeight: "700" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>🌙 Sleep time</label>
                  <input type="time" value={sleep} onChange={e => setSleep(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #eeeeee", fontSize: "16px", fontWeight: "700" }} />
                </div>
              </div>
              <button onClick={saveSettings} style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "#1cb0f6", color: "white", fontWeight: "700", border: "none", boxShadow: "0 4px 0 #1899d6", cursor: "pointer", fontSize: "14px" }}>
                SAVE SETTINGS
              </button>
            </div>
          )}

          {saved && (
            <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", background: "#1f1f1f", color: "white", padding: "14px 28px", borderRadius: "14px", fontWeight: "700", fontSize: "14px", zIndex: 9999, animation: "fadeInUp 0.3s" }}>
              ✓ Settings saved!
            </div>
          )}

          {/* Recent Log History */}
          {allLogs.length > 0 && (
            <div style={{ background: "white", border: "2px solid #eeeeee", borderRadius: "20px", padding: "28px", marginBottom: "24px" }}>
              <div style={{ fontWeight: "700", fontSize: "13px", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>RECENT HISTORY</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {allLogs.slice(0, 7).map(([dateKey, log]) => {
                  const date = new Date(dateKey);
                  const label = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                  const lastUsage = log.usages?.slice(-1)?.[0]?.amount;
                  return (
                    <div key={dateKey} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "12px", background: "#f7f7f7" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: log.checkedOut ? "#58cc02" : log.checkedIn ? "#ffc107" : "#eeeeee", flexShrink: 0 }} />
                      <div style={{ fontWeight: "700", fontSize: "14px", minWidth: "120px" }}>{label}</div>
                      <div style={{ flex: 1, fontSize: "13px", color: "#afafaf" }}>
                        {log.cravings?.length ?? 0} cravings · {lastUsage !== undefined ? `${lastUsage} ${data.unit}` : "no usage logged"}
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: log.checkedOut ? "#58cc02" : log.checkedIn ? "#ffc107" : "#afafaf" }}>
                        {log.checkedOut ? "✓ Complete" : log.checkedIn ? "In Progress" : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div style={{ background: "#fff5f5", border: "2px solid #fde8e8", borderRadius: "20px", padding: "24px" }}>
            <div style={{ fontWeight: "700", fontSize: "13px", color: "#e53e3e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>⚠ Reset Journey</div>
            <p style={{ fontSize: "13px", color: "#777", marginBottom: "16px" }}>This permanently deletes all your logs and resets your streak. You'll be taken back to setup.</p>
            <button onClick={resetJourney} style={{ padding: "10px 20px", borderRadius: "10px", border: "2px solid #fca5a5", background: "white", color: "#e53e3e", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
              Reset & Start Over
            </button>
          </div>

        </div>
      </section>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
