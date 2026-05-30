"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { getDailyTarget, HABIT_ACTION, loadBloom, saveBloom, getOrInitDay, getLocalISODate } from "@/lib/bloom-db";
import type { BloomJourney } from "@/lib/bloom-types";

/* ── Types ── */
type BloomData = BloomJourney;

/* ── Winding path generator ── */
const WEEK_THEMES = [
  { title: "Week 1 — The Awakening", desc: "Observe and log. No pressure.",           color: "#58cc02", shadow: "#46a302", image: "/Digital Garden.png"  },
  { title: "Week 2 — Deep Roots",    desc: "The first real reduction begins.",         color: "#1cb0f6", shadow: "#1899d6", image: "/Science Backed.png" },
  { title: "Week 3 — The Bloom",     desc: "Halfway there. Your garden grows.",        color: "#ff9600", shadow: "#e08600", image: "/Digital Garden.png"  },
  { title: "Week 4 — Freedom",       desc: "The final push. You've got this.",         color: "#a855f7", shadow: "#8b3fe0", image: "/Science Backed.png" },
];
const ICONS = ["🌱","🍃","💧","☀️","🪴","🦋","🏠","🌿","🧠","⚡","💪","🔥","🧘","🎯","🌸","🍀","🌲","⛅","🏔️","🌈","🏅","🎖️","🌻","🏆","⭐","💫","✨","🌟"];
const OFFSETS_EVEN = [80, 140, 190, 220, 190, 140, 80];
const OFFSETS_ODD  = [-80, -140, -190, -220, -190, -140, -80];

const MOBILE_OFFSETS_EVEN = [30, 70, 100, 120, 100, 70, 30];
const MOBILE_OFFSETS_ODD  = [-30, -70, -100, -120, -100, -70, -30];

const CHAPTERS = WEEK_THEMES.map((theme, w) => ({
  ...theme, id: w + 1,
  levels: Array.from({ length: 7 }, (_, d) => ({
    id: w * 7 + d + 1,
    dayNum: w * 7 + d + 1,
    icon: ICONS[(w * 7 + d) % ICONS.length],
    offset: `${w % 2 === 0 ? OFFSETS_EVEN[d] : OFFSETS_ODD[d]}px`,
    mobileOffset: `${w % 2 === 0 ? MOBILE_OFFSETS_EVEN[d] : MOBILE_OFFSETS_ODD[d]}px`,
    isEven: w % 2 === 0,
  })),
}));

/* ── Helpers ── */
const todayKey  = () => getLocalISODate();
const dateKey   = (startDate: string, dayNum: number) => {
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayNum - 1);
  return getLocalISODate(d);
};
const daysSince = (startDate: string) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - start.getTime()) / 86400000);
};

const loadData = (): BloomData | null => loadBloom() as BloomData | null;
const saveData = (d: BloomData) => saveBloom(d);

/* ── Interactive Usage Tracker ── */
function UsageTracker({ dayId, data, dayKey, isToday }: {
  dayId: number; data: BloomData; dayKey: string; isToday: boolean;
}) {
  const target = getDailyTarget(data.quantity, dayId);
  const getCount = useCallback(
    (d: BloomData) => (d.logs?.[dayKey]?.usages ?? []).reduce((sum, usage) => sum + usage.amount, 0),
    [dayKey],
  );
  const [count, setCount] = useState(() => getCount(data));

  useEffect(() => {
    const refresh = () => {
      const d = loadBloom();
      if (d) setCount(getCount(d));
    };
    window.addEventListener("bloom_update", refresh);
    return () => window.removeEventListener("bloom_update", refresh);
  }, [getCount]);

  const isOver  = count > target;
  const isExact = count === target;
  const pct     = target > 0 ? Math.min(100, (count / target) * 100) : 100;
  const barColor = isOver ? "#ff4b4b" : isExact ? "#ffc107" : "#58cc02";
  const useDots  = target <= 20;

  const mutate = (delta: number) => {
    if (!isToday) return;
    const d = loadBloom()!;
    const day = getOrInitDay(d, dayKey);
    if (delta === 1) {
      day.usages.push({ timestamp: Date.now(), amount: 1 });
    } else if (delta === -1 && day.usages.length > 0) {
      day.usages.pop();
    }
    saveBloom(d);
    setCount(prev => Math.max(0, prev + delta));
  };

  const msg = isOver
    ? `${count - target} over limit — log it honestly. The plan adjusts, not your streak.`
    : isExact
    ? `Exactly ${target} today. That's your goal. Hold the line — not one more.`
    : `${target - count} ${data.unit} left today. Stay on track — you've got this.`;

  return (
    <div className="usage-tracker-card" style={{
      background: "white",
      border: `2px solid ${isOver ? "#ffd0d0" : isExact ? "#ffe082" : "#eeeeee"}`,
      borderRadius: "20px", padding: "24px", marginBottom: "16px",
    }}>
      <div className="usage-tracker-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
            Daily Goal · Week {Math.ceil(dayId / 7)}
          </div>
          <div style={{ fontSize: "42px", fontWeight: "900", color: barColor, lineHeight: 1 }}>{count}</div>
          <div style={{ fontSize: "13px", color: "#afafaf", marginTop: "2px" }}>of {target} {data.unit}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#afafaf", marginBottom: "4px" }}>TARGET</div>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "#afafaf" }}>{target}</div>
        </div>
      </div>

      {useDots && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
          {Array.from({ length: Math.max(target, count) }, (_, i) => (
            <div key={i} style={{
              width: "28px", height: "28px", borderRadius: "50%",
              backgroundColor: i < count ? (i < target ? barColor : "#ff4b4b") : "#eeeeee",
              border: i === target - 1 && !isOver ? `2px dashed ${barColor}` : "none",
              transition: "background 0.25s",
            }} />
          ))}
        </div>
      )}

      <div style={{ height: "10px", background: "#eeeeee", borderRadius: "10px", marginBottom: "12px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "10px", transition: "width 0.35s ease, background 0.3s" }} />
      </div>

      <div style={{ fontSize: "13px", fontWeight: "700", color: isOver ? "#c0392b" : isExact ? "#c99700" : "#58cc02", marginBottom: "14px" }}>
        {isOver ? "⚠️ " : isExact ? "🎉 " : "✅ "}{msg}
      </div>

      <div style={{ fontSize: "12px", color: "#afafaf", marginBottom: "16px", padding: "10px 14px", background: "#f7f7f7", borderRadius: "10px", lineHeight: 1.5 }}>
        💚 <strong>Be honest</strong> — logging over-limit helps the AI build a smarter plan next week. It never resets your streak.
      </div>

      {isToday && (
        <div className="usage-tracker-actions" style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => mutate(-1)} disabled={count === 0}
            style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "2px solid #eeeeee", borderBottom: "4px solid #eeeeee", background: "white", fontWeight: "700", fontSize: "13px", cursor: count > 0 ? "pointer" : "default", color: count > 0 ? "#4b4b4b" : "#d5d5d5" }}
            onMouseDown={e => { e.currentTarget.style.transform = "translateY(4px)"; e.currentTarget.style.borderBottom = "0px"; }}
            onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderBottom = "4px solid #eeeeee"; }}
          >↩ Undo</button>
          <button onClick={() => mutate(1)}
            style={{ flex: 3, padding: "12px", borderRadius: "12px", border: "none", borderBottom: `4px solid ${isOver ? "#c0392b" : "#46a302"}`, background: isOver ? "#ff4b4b" : "#58cc02", color: "white", fontWeight: "800", fontSize: "14px", cursor: "pointer", letterSpacing: "0.5px" }}
            onMouseDown={e => { e.currentTarget.style.transform = "translateY(4px)"; e.currentTarget.style.borderBottom = "0px"; }}
            onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderBottom = `4px solid ${isOver ? "#c0392b" : "#46a302"}`; }}
          >{HABIT_ACTION[data.habit] ?? "Log"} +1</button>
        </div>
      )}
    </div>
  );
}

/* ── Day View ── */

function DayView({ dayId, data, onBack, onComplete }: {
  dayId: number; data: BloomData;
  onBack: () => void; onComplete: () => void;
}) {
  const wake  = parseInt(data.wakeTime?.split(":")?.[0] ?? "7");
  const sleep = parseInt(data.sleepTime?.split(":")?.[0] ?? "23");
  let length = sleep - wake + 1;
  if (length <= 0) length += 24;
  const hours: number[] = Array.from({ length }, (_, i) => (wake + i) % 24);

  const key     = dateKey(data.startDate, dayId);
  const log     = data.logs[key] ?? { cravings: [], usages: [], checkedIn: false, checkedOut: false };
  const isToday = key === todayKey();
  const isPast  = key < todayKey();

  const cravingHours = new Set((log.cravings || []).map(c => c.hour));
  const usageHours   = new Set((log.usages || []).map(u => {
    return u.timestamp ? new Date(u.timestamp).getHours() : -1;
  }));

  const [checkedIn, setCheckedIn]   = useState(log.checkedIn ?? false);
  const [checkedOut, setCheckedOut] = useState(log.checkedOut ?? false);
  const [toast, setToast]           = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const doCheckIn = () => {
    const d = loadData()!;
    if (!d.logs[key]) d.logs[key] = { cravings: [], usages: [], checkedIn: false, checkedOut: false };
    d.logs[key].checkedIn = true;
    saveData(d);
    setCheckedIn(true);
    window.dispatchEvent(new Event("bloom_update"));
    showToast("🌅 Good morning! Today's battle starts now.");
  };

  const doCheckOut = () => {
    const d = loadData()!;
    if (!d.logs[key]) d.logs[key] = { cravings: [], usages: [], checkedIn: false, checkedOut: false };
    d.logs[key].checkedOut = true;
    // Streak logic
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().split("T")[0];
    if (d.lastCompletedDate === yKey || !d.lastCompletedDate) {
      d.currentStreak = (d.currentStreak ?? 0) + 1;
    } else {
      d.currentStreak = 1;
    }
    d.longestStreak = Math.max(d.longestStreak ?? 0, d.currentStreak);
    d.lastCompletedDate = key;
    saveData(d);
    setCheckedOut(true);
    window.dispatchEvent(new Event("bloom_update"));
    showToast("🌙 Day complete! Streak updated. Keep going!");
    setTimeout(onComplete, 1500);
  };

  const logHourCraving = (h: number) => {
    const d = loadData()!;
    if (!d.logs[key]) d.logs[key] = { cravings: [], usages: [], checkedIn: false, checkedOut: false };
    console.debug("[Bloom][Craving] Day view click", {
      dayKey: key,
      hour: h,
      existingCravings: d.logs[key].cravings.length,
      deviceId: d.deviceId ?? null,
    });
    d.logs[key].cravings.push({ timestamp: Date.now(), hour: h, minute: new Date().getMinutes() });
    saveData(d);
    window.dispatchEvent(new Event("bloom_update"));
    showToast(`⚡ Craving at ${h % 12 || 12} ${h >= 12 ? "PM" : "AM"} logged!`);
  };

  const dayDate = new Date(data.startDate);
  dayDate.setDate(dayDate.getDate() + dayId - 1);
  const dayLabel = dayDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="day-view" style={{ width: "100%", maxWidth: "560px", padding: "40px 0", animation: "fadeInUp 0.35s ease-out" }}>
      {/* Header */}
      <div className="day-view-header" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <button onClick={onBack} style={{ width: "44px", height: "44px", borderRadius: "50%", border: "2px solid #eeeeee", background: "white", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 0 #eeeeee", flexShrink: 0 }}>←</button>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px" }}>Day {dayId} · {dayLabel}</div>
          <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#1f1f1f" }}>
            {isToday ? "Today's Battle Plan" : isPast ? "Past Day View" : "Upcoming Day"}
          </h1>
        </div>
      </div>

      {/* ── Interactive Usage Tracker ── */}
      <UsageTracker dayId={dayId} data={data} dayKey={key} isToday={isToday} />

      {/* Morning check-in */}

      <div className="day-check-card" style={{ background: checkedIn ? "#edfce0" : "white", border: `2px solid ${checkedIn ? "#b8f0a0" : "#eeeeee"}`, borderRadius: "18px", padding: "20px 24px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: "800", color: checkedIn ? "#2d6a00" : "#1f1f1f", fontSize: "15px" }}>🌅 Morning Check-In</div>
          <div style={{ fontSize: "13px", color: "#afafaf", marginTop: "4px" }}>Set your intention. Log starts now.</div>
        </div>
        {checkedIn
          ? <div style={{ fontSize: "13px", fontWeight: "700", color: "#58cc02" }}>✓ Done</div>
          : <button onClick={doCheckIn} disabled={!isToday} style={{ padding: "10px 20px", borderRadius: "12px", backgroundColor: isToday ? "#58cc02" : "#afafaf", color: "white", fontWeight: "700", border: "none", boxShadow: isToday ? "0 4px 0 #46a302" : "none", cursor: isToday ? "pointer" : "default", fontSize: "13px" }}>
              {isToday ? "CHECK IN" : "—"}
            </button>
        }
      </div>

      {/* Craving summary bar */}
      {log.cravings.length > 0 && (
        <div style={{ background: "#fff8e1", border: "2px solid #ffe082", borderRadius: "14px", padding: "14px 20px", marginBottom: "12px", fontSize: "14px", color: "#775a00", fontWeight: "700" }}>
          ⚡ {log.cravings.length} craving{log.cravings.length !== 1 ? "s" : ""} logged today — you tracked every one. That takes strength.
        </div>
      )}

      {/* Hourly Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
        {hours.map((h) => {
          const hasCraving = cravingHours.has(h);
          const hasUsage   = usageHours.has(h);
          return (
            <div className="hour-row" key={h} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "14px 18px",
              backgroundColor: hasCraving ? "#fff8e1" : "white",
              borderRadius: "14px",
              border: `2px solid ${hasCraving ? "#ffe082" : "#eeeeee"}`,
            }}>
              <div style={{ minWidth: "60px", fontWeight: "800", fontSize: "13px", color: "#afafaf" }}>
                {h === 0 ? "12" : h > 12 ? h - 12 : h}:00 {h >= 12 ? "PM" : "AM"}
              </div>
              <div style={{ flex: 1, display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                {hasCraving && <span style={{ fontSize: "11px", background: "#ffc107", color: "white", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>⚡ CRAVING</span>}
                {hasUsage   && <span style={{ fontSize: "11px", background: "#58cc02", color: "white", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>📝 LOGGED</span>}
              </div>
              {isToday && (
                <button
                  onClick={() => logHourCraving(h)}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: `2px solid ${hasCraving ? "#ffc107" : "#eeeeee"}`, color: hasCraving ? "#c99700" : "#afafaf", fontWeight: "700", fontSize: "11px", backgroundColor: "white", cursor: "pointer" }}
                >
                  + BELL
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage summary */}
      {log.usages.length > 0 && (
        <div style={{ background: "#edfce0", border: "2px solid #b8f0a0", borderRadius: "14px", padding: "14px 20px", marginBottom: "12px", fontSize: "14px", color: "#2d6a00", fontWeight: "600" }}>
          📊 Today's total: <strong>{log.usages.reduce((sum, usage) => sum + usage.amount, 0)} {data.unit}</strong> — Target: <strong>{getDailyTarget(data.quantity, dayId)} {data.unit}</strong>
        </div>
      )}

      {/* Night check-out */}
      {checkedOut
        ? <div style={{ background: "linear-gradient(135deg, #58cc02, #1cb0f6)", borderRadius: "20px", padding: "32px", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏆</div>
            <h3 style={{ fontSize: "20px", color: "white", fontWeight: "900" }}>Day Complete!</h3>
            <p style={{ opacity: 0.9, fontSize: "14px", marginTop: "8px" }}>Your streak has been updated. Well done.</p>
          </div>
        : <div style={{ background: "linear-gradient(135deg, #1f2937, #374151)", borderRadius: "20px", padding: "32px", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🌙</div>
            <h3 style={{ fontSize: "20px", color: "white", fontWeight: "900" }}>End of Day Check-Out</h3>
            <p style={{ opacity: 0.7, fontSize: "14px", marginTop: "8px", marginBottom: "24px" }}>Lock in today's progress. This updates your streak.</p>
            <button
              onClick={doCheckOut}
              disabled={!isToday}
              style={{ padding: "14px 32px", borderRadius: "14px", border: "none", backgroundColor: isToday ? "#58cc02" : "#555", color: "white", fontWeight: "800", cursor: isToday ? "pointer" : "default", fontSize: "14px", boxShadow: isToday ? "0 4px 0 #46a302" : "none" }}
            >
              {isToday ? "✓ COMPLETE DAY" : "Available at end of your day"}
            </button>
          </div>
      }

      {toast && (
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", background: "#1f1f1f", color: "white", padding: "14px 28px", borderRadius: "14px", fontWeight: "700", fontSize: "14px", zIndex: 9999, animation: "fadeInUp 0.3s", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const router = useRouter();
  const [data,        setData]        = useState<BloomData | null>(null);
  const [isHydrated,  setIsHydrated]  = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [animatingDay, setAnimatingDay] = useState<number | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const d = loadData();
    if (d) setData(d);
  }, []);

  const refresh = useCallback(() => {
    const d = loadData();
    if (!d) { router.push("/setup"); return; }
    setData(d);
  }, [router]);

  useEffect(() => {
    if (isHydrated && !data) router.push("/setup");
    window.addEventListener("bloom_update", refresh);
    return () => window.removeEventListener("bloom_update", refresh);
  }, [isHydrated, data, refresh, router]);

  if (!isHydrated || !data) {
    return (
      <main className="dashboard-layout" style={{ minHeight: "100vh", backgroundColor: "white", display: "flex" }}>
        <section className="dashboard-main" style={{ flex: 1, marginLeft: "248px", backgroundColor: "#fdfdfd", minHeight: "100vh", minWidth: 0, overflowX: "hidden" }} />
      </main>
    );
  }

  const daysSinceStart = daysSince(data.startDate);
  const todayLogKey    = todayKey();
  const todayLog       = data.logs?.[todayLogKey];
  const streak         = data.currentStreak ?? 0;
  const todayCravings  = todayLog?.cravings?.length ?? 0;
  const todayTotal     = (todayLog?.usages ?? []).reduce((sum, usage) => sum + (usage.amount ?? 0), 0);
  const todayTarget    = getDailyTarget(data.quantity, daysSinceStart + 1);

  const activeDayNum = Math.min(28, daysSinceStart + 1);
  const activeChapterId = Math.ceil(activeDayNum / 7);


  const getDayStatus = (dayNum: number): "done" | "today" | "locked" => {
    if (dayNum - 1 < daysSinceStart) return "done";
    if (dayNum - 1 === daysSinceStart) return "today";
    return "locked";
  };

  const openDay = (dayId: number) => {
    setAnimatingDay(dayId);
    window.setTimeout(() => {
      setSelectedDay(dayId);
      setAnimatingDay(null);
    }, 180);
  };

  return (
    <main className="dashboard-layout" style={{ minHeight: "100vh", backgroundColor: "white", display: "flex" }}>
      <AppSidebar activeNav="LEARN" />

      {/* Analysis Overlay */}
      {isAnalysisOpen && (
        <div 
          className="analysis-overlay"
          onClick={() => setIsAnalysisOpen(false)}
        />
      )}

      {/* Analysis Trigger Button */}
      <button 
        className="analysis-trigger-btn"
        onClick={() => setIsAnalysisOpen(prev => !prev)}
      >
        📊 Analysis
      </button>

      {/* ── Main Roadmap ── */}
      <section className="dashboard-main" style={{ flex: 1, marginLeft: "248px", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "120px", backgroundColor: "#fdfdfd", minHeight: "100vh", minWidth: 0, overflowX: "hidden" }}>
        {selectedDay
          ? <DayView
              key={selectedDay}
              dayId={selectedDay}
              data={data}
              onBack={() => setSelectedDay(null)}
              onComplete={() => { setSelectedDay(null); refresh(); }}
            />
          : CHAPTERS.map((chapter, cIdx) => {
            const isActiveChapter = chapter.id === activeChapterId;
            return (
            <div className="chapter-shell" key={chapter.id} style={{ width: "100%", maxWidth: "680px", position: "relative", marginBottom: "80px" }}>
              {/* Chapter header */}
              <div className="chapter-header" style={{ backgroundColor: chapter.color, borderRadius: "20px", padding: "24px 28px", color: "white", marginTop: "48px", marginBottom: "80px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: `0 6px 0 ${chapter.shadow}` }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", opacity: 0.75, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "6px" }}>7 Days</div>
                  <h2 style={{ fontSize: "22px", fontWeight: "900", color: "white" }}>{chapter.title}</h2>
                  <p style={{ opacity: 0.85, fontSize: "14px", marginTop: "4px" }}>{chapter.desc}</p>
                </div>
                <img src={chapter.image} alt="" style={{ width: "72px", height: "72px", borderRadius: "14px", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }} />
              </div>

              {/* Snake Path */}
              <div className="chapter-path" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "40px" }}>
                {/* Mascot in belly */}
                {isActiveChapter && (
                  <div className={`chapter-mascot ${cIdx % 2 === 0 ? "mascot-even" : "mascot-odd"}`} style={{
                    position: "absolute",
                    top: "210px", width: "240px", textAlign: "center", zIndex: 1, pointerEvents: "none"
                  }}>
                    <img src="/mascot-isolated.png" alt="" style={{ width: "100%", animation: "mascotFloat 4s ease-in-out infinite" }} />
                    <span style={{ display: "inline-block", background: "white", padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", color: chapter.color, border: `2px solid ${chapter.color}`, marginTop: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                      YOU ARE HERE
                    </span>
                  </div>
                )}

                {/* Level dots */}
                {chapter.levels.map((level) => {
                  const status = getDayStatus(level.dayNum);
                  const isToday = status === "today" || (daysSinceStart >= 28 && level.dayNum === 28);
                  return (
                    <div key={level.id} className={`level-wrapper ${animatingDay === level.id ? "is-animating" : ""}`} style={{
                      position: "relative",
                      "--mobile-offset": level.mobileOffset,
                      "--cavity-dir": level.isEven ? "-1" : "1",
                    } as React.CSSProperties}>
                      <button
                        onClick={() => openDay(level.id)}
                        title={`Day ${level.dayNum}${status === "locked" ? " — Future preview" : ""}`}
                        style={{
                          width: "88px", height: "80px", borderRadius: "50%",
                          backgroundColor: status === "done" ? "#d4f0a0" : status === "today" ? chapter.color : "#eeeeee",
                          border: status === "today" ? `4px solid white` : "none",
                          outline: status === "today" ? `3px solid ${chapter.color}` : "none",
                          boxShadow: status === "done" ? "0 8px 0 #b0d870" : status === "today" ? `0 8px 0 ${chapter.shadow}` : "0 8px 0 #d5d5d5",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: status === "done" ? "28px" : "32px",
                          cursor: "pointer",
                          transform: `translateX(${level.offset}) ${animatingDay === level.id ? "translateY(4px) scale(0.96)" : ""}`,
                          position: "relative", zIndex: 5,
                          transition: "transform 0.18s ease, filter 0.15s ease",
                        }}
                        className="level-btn"
                      >
                        {status === "done" ? "✓" : level.icon}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
        }
      </section>

      {/* ── Right Stats Sidebar ── */}
      <aside className={`dashboard-stats ${isAnalysisOpen ? "analysis-open" : ""}`} style={{ width: "320px", padding: "32px 20px", position: "sticky", top: 0, height: "100vh", backgroundColor: "white", borderLeft: "2px solid #eeeeee", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1f1f1f" }}>Daily Stats</h3>
          <button className="analysis-close-btn" onClick={() => setIsAnalysisOpen(false)}>✕</button>
        </div>

        {/* Streak */}
        <div style={{ padding: "20px", borderRadius: "16px", border: "2px solid #eeeeee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: "700", fontSize: "12px", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px" }}>🔥 Streak</span>
            <span style={{ fontWeight: "900", fontSize: "28px", color: streak > 0 ? "#ffc107" : "#afafaf" }}>{streak}</span>
          </div>
          <div style={{ height: "8px", backgroundColor: "#eeeeee", borderRadius: "8px" }}>
            <div style={{ width: `${Math.min(100, (streak / 28) * 100)}%`, height: "100%", backgroundColor: "#ffc107", borderRadius: "8px", transition: "width 0.5s ease" }} />
          </div>
          <div style={{ fontSize: "11px", color: "#afafaf", marginTop: "8px" }}>Longest: {data.longestStreak ?? 0} days</div>
        </div>

        {/* Today's summary */}
        <div style={{ padding: "20px", borderRadius: "16px", border: "2px solid #eeeeee" }}>
          <div style={{ fontWeight: "700", fontSize: "12px", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>⚡ Today's Cravings</div>
          <div style={{ fontSize: "36px", fontWeight: "900", color: todayCravings > 0 ? "#ffc107" : "#afafaf" }}>{todayCravings}</div>
          <div style={{ fontSize: "12px", color: "#afafaf", marginTop: "4px" }}>
            {todayCravings === 0 ? "None logged yet." : todayCravings === 1 ? "1 craving resisted!" : `${todayCravings} cravings tracked — great awareness!`}
          </div>
        </div>

        {/* Daily usage */}
        <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: "#f7f7f7" }}>
          <div style={{ fontWeight: "700", fontSize: "12px", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>📋 Daily Usage</div>
          {todayTotal > 0
            ? <div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: todayTotal > todayTarget ? "#ff4b4b" : "#58cc02" }}>{todayTotal}</div>
                <div style={{ fontSize: "12px", color: "#afafaf" }}>{data.unit} today · Target: {todayTarget}</div>
                <div style={{ marginTop: "10px", height: "8px", background: "#eeeeee", borderRadius: "8px" }}>
                  <div style={{ width: `${Math.min(100, (todayTotal / todayTarget) * 100)}%`, height: "100%", background: todayTotal > todayTarget ? "#ff4b4b" : "#58cc02", borderRadius: "8px", transition: "width 0.4s ease" }} />
                </div>
              </div>
            : <p style={{ fontSize: "13px", color: "#afafaf" }}>No usage logged yet. Target: {todayTarget} {data.unit}</p>
          }
        </div>

        {/* Today's tip */}
        <div style={{ padding: "20px", borderRadius: "16px", backgroundColor: "#fff8e1", border: "2px solid #ffe082" }}>
          <div style={{ fontWeight: "700", fontSize: "12px", color: "#c99700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>💡 Today's Tip</div>
          <p style={{ fontSize: "13px", color: "#775a00", lineHeight: 1.7 }}>
            {data.trigger === "Stress"   && "When stress hits, pause for 5 minutes. Drink ice water — it reduces craving intensity by up to 40%."}
            {data.trigger === "Social"   && "Before social events, set a firm limit in your head. Rehearsing the 'no' makes it 3x easier to say it."}
            {data.trigger === "Boredom"  && "Keep your hands busy. Squeeze a stress ball, chew gum, or step outside for 2 minutes."}
            {data.trigger === "Routine"  && "Break the routine. Change just one small thing about the time or place when the urge normally hits."}
            {!data.trigger              && "The urge to use peaks at 3 minutes and fades. Just wait 5 minutes — it almost always passes."}
          </p>
        </div>

        {/* Journey start */}
        <div style={{ padding: "16px 20px", borderRadius: "14px", border: "2px solid #eeeeee", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#afafaf", marginBottom: "4px" }}>JOURNEY STARTED</div>
          <div style={{ fontWeight: "800", color: "#4b4b4b" }}>Day {daysSinceStart + 1} of 28</div>
          <div style={{ fontSize: "11px", color: "#58cc02", marginTop: "4px" }}>{new Date(data.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>

        {/* Future AI Insights Placeholder */}
        <div style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)", border: "2px solid #bae6fd" }}>
          <div style={{ fontWeight: "700", fontSize: "12px", color: "#0284c7", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            ✨ AI Insights <span style={{ background: "#38bdf8", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "800" }}>SOON</span>
          </div>
          <p style={{ fontSize: "12px", color: "#0369a1", lineHeight: 1.6 }}>
            Personalized behavioral analysis and pattern detection will appear here as your garden grows.
          </p>
        </div>
      </aside>

      <style jsx>{`
        .level-btn:hover { filter: brightness(1.08); }
        @keyframes mascotFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .level-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 5;
        }

        .mascot-even {
          left: 80px;
        }
        .mascot-odd {
          right: 80px;
        }

        .analysis-overlay,
        .analysis-trigger-btn,
        .analysis-close-btn {
          display: none;
        }

        @media (max-width: 1024px) {
          .level-wrapper {
            transform: translateX(var(--mobile-offset)) var(--anim-transform, ) !important;
            transition: transform 0.18s ease;
          }
          
          .level-wrapper.is-animating {
            --anim-transform: translateY(4px) scale(0.96);
          }

          .level-btn {
            transform: none !important; /* override the inline desktop transform */
          }

          .chapter-mascot {
            width: 160px !important;
          }
          
          .mascot-even {
            left: 50%;
            transform: translateX(calc(-50% - 130px));
          }
          
          .mascot-odd {
            right: auto;
            left: 50%;
            transform: translateX(calc(-50% + 130px));
          }

          .dashboard-main {
            margin-left: 220px !important;
            padding: 32px 16px 72px !important;
          }

          .dashboard-stats {
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            width: 320px !important;
            max-width: 85vw !important;
            height: 100vh !important;
            z-index: 200 !important;
            transform: translateX(110%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: -4px 0 24px rgba(0,0,0,0.1);
            padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 12px)) !important;
            border-left: none !important;
          }
          
          .dashboard-stats.analysis-open {
            transform: translateX(0);
          }

          .analysis-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 42, 45, 0.24);
            z-index: 180;
            backdrop-filter: blur(2px);
          }

          .analysis-trigger-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            position: fixed;
            top: 24px;
            right: 0;
            background: white;
            border: 2px solid #eeeeee;
            border-right: none;
            padding: 12px 16px;
            border-top-left-radius: 14px;
            border-bottom-left-radius: 14px;
            font-weight: 800;
            font-size: 13px;
            color: #4b4b4b;
            cursor: pointer;
            z-index: 90;
            box-shadow: -4px 4px 16px rgba(0,0,0,0.06);
            transition: transform 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .analysis-trigger-btn:active {
            transform: scale(0.96);
          }

          .analysis-close-btn {
            display: flex;
            background: #f7f7f7;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-size: 14px;
            font-weight: 800;
            color: #777;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
          }
          .analysis-close-btn:hover {
            background: #eeeeee;
          }

          .chapter-shell {
            max-width: 100% !important;
          }
        }

        @media (max-width: 767px) {
          .chapter-mascot {
            width: 120px !important;
          }
          .mascot-even {
            transform: translateX(calc(-50% - 100px));
          }
          .mascot-odd {
            transform: translateX(calc(-50% + 100px));
          }
          
          .dashboard-layout {
            flex-direction: column;
          }

          .dashboard-main {
            margin-left: 0 !important;
            padding: 72px 14px 40px !important;
          }

          .analysis-trigger-btn {
            top: 14px;
          }

          .chapter-header,
          .day-check-card,
          .usage-tracker-header,
          .day-view-header,
          .hour-row {
            flex-direction: column;
            align-items: flex-start !important;
          }

          .usage-tracker-header > div {
            text-align: left !important;
          }

          .chapter-header {
            gap: 16px;
            margin-top: 20px !important;
            margin-bottom: 32px !important;
            padding: 20px !important;
          }

          .chapter-path {
            gap: 24px !important;
          }

          .level-btn {
            width: 72px !important;
            height: 72px !important;
            font-size: 26px !important;
          }

          .day-view {
            max-width: 100% !important;
            padding: 20px 0 !important;
            overflow-x: hidden;
            width: 100% !important;
          }

          .usage-tracker-card,
          .day-check-card,
          .dashboard-stats > div {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .usage-tracker-actions {
            width: 100%;
          }

          .usage-tracker-actions button {
            min-width: 0;
          }

          .hour-row {
            padding: 12px 14px !important;
          }
        }

        @media (max-width: 480px) {
          .dashboard-main {
            padding: 16px 10px 32px !important;
          }

          .usage-tracker-actions {
            flex-direction: column;
          }

          .day-view-header h1 {
            font-size: 20px !important;
          }

          .day-view-header button {
            width: 40px !important;
            height: 40px !important;
          }

          .hour-row button,
          .day-check-card button,
          .usage-tracker-actions button {
            width: 100%;
          }

          .dashboard-stats {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>
    </main>
  );
}
