"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { getDaysSince, getLocalISODate, loadBloom } from "@/lib/bloom-db";
import type { BloomJourney } from "@/lib/bloom-types";

const GARDEN_STAGES = [
  { minDays: 0,  emoji: "🌱", label: "Seedling",        desc: "Your journey has just begun. A tiny seed of change.",          color: "#a8e063", bg: "#f0fde4" },
  { minDays: 3,  emoji: "🪴", label: "First Sprout",    desc: "Something is growing. Your commitment is taking root.",        color: "#58cc02", bg: "#edfce0" },
  { minDays: 7,  emoji: "🌿", label: "Young Plant",     desc: "One week in. The roots are deeper than you think.",            color: "#2ecc71", bg: "#e8faf0" },
  { minDays: 14, emoji: "🌸", label: "Flowering",       desc: "Two weeks strong. Your garden is starting to bloom.",          color: "#fd79a8", bg: "#fce4ec" },
  { minDays: 21, emoji: "🌺", label: "In Full Bloom",   desc: "Three weeks of growth. You are becoming who you want to be.",  color: "#e84393", bg: "#fce4ec" },
  { minDays: 28, emoji: "🌳", label: "Ancient Tree",    desc: "A full month. You've built something that will last forever.",  color: "#27ae60", bg: "#e8faf0" },
];

function getStage(streak: number) {
  return [...GARDEN_STAGES].reverse().find(s => streak >= s.minDays) ?? GARDEN_STAGES[0];
}

function DayDot({ status }: { status: "done" | "active" | "empty" }) {
  return (
    <div style={{
      width: "28px", height: "28px", borderRadius: "50%",
      backgroundColor: status === "done" ? "#58cc02" : status === "active" ? "#ffc107" : "#eeeeee",
      border: status === "active" ? "3px solid #ffc107" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "12px",
    }}>
      {status === "done" ? "✓" : ""}
    </div>
  );
}

export default function GardenPage() {
  const router = useRouter();
  const [data, setData] = useState<BloomJourney | null>(() => loadBloom());

  useEffect(() => {
    if (!data) { router.push("/setup"); return; }

    const refresh = () => {
      const fresh = loadBloom();
      if (fresh) setData(fresh);
    };
    window.addEventListener("bloom_update", refresh);
    return () => window.removeEventListener("bloom_update", refresh);
  }, [data, router]);

  if (!data) return null;

  const streak = data.currentStreak ?? 0;
  const stage  = getStage(streak);
  const daysSince = getDaysSince(data.startDate);
  const nextStage = GARDEN_STAGES.find(s => s.minDays > streak);
  const daysToNext = nextStage ? nextStage.minDays - streak : 0;

  // Build 28-day grid
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(data.startDate);
    d.setDate(d.getDate() + i);
    const key = getLocalISODate(d);
    const log = data.logs?.[key];
    const checked = log?.checkedOut;
    const active  = i === daysSince;
    return { dayNum: i + 1, checked, active, date: d };
  });

  // Count total cravings across all days
  const totalCravings = Object.values(data.logs ?? {}).reduce((sum, log) => sum + (log.cravings?.length ?? 0), 0);
  const totalDaysLogged = Object.values(data.logs ?? {}).filter((log) => log.checkedOut).length;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "white", display: "flex" }}>
      <AppSidebar activeNav="GARDEN" />

      <section style={{ flex: 1, marginLeft: "248px", padding: "48px 40px", backgroundColor: "#fdfdfd", minHeight: "100vh" }}>
        <div style={{ maxWidth: "800px" }}>

          <div style={{ marginBottom: "40px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>YOUR DIGITAL GARDEN</div>
            <h1 style={{ fontSize: "36px", fontWeight: "900" }}>Watch Yourself Grow</h1>
          </div>

          {/* Main Garden Card */}
          <div style={{ background: stage.bg, border: `2px solid ${stage.color}30`, borderRadius: "28px", padding: "48px", textAlign: "center", marginBottom: "28px", position: "relative", overflow: "hidden" }}>
            {/* Background decoration */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: "-60px", left: "-60px", width: "240px", height: "240px", borderRadius: "50%", background: `${stage.color}15` }} />
              <div style={{ position: "absolute", bottom: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: `${stage.color}10` }} />
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "120px", lineHeight: 1, marginBottom: "8px", animation: "gentleBob 4s ease-in-out infinite" }}>{stage.emoji}</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: stage.color, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>{stage.label}</div>
              <p style={{ fontSize: "17px", color: "#4b4b4b", maxWidth: "400px", margin: "0 auto 28px", lineHeight: 1.6 }}>{stage.desc}</p>

              {/* Streak badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "white", padding: "12px 28px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <span style={{ fontSize: "28px" }}>🔥</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "#ffc107", lineHeight: 1 }}>{streak}</div>
                  <div style={{ fontSize: "12px", color: "#afafaf" }}>day streak</div>
                </div>
              </div>

              {nextStage && (
                <div style={{ marginTop: "20px", fontSize: "13px", color: "#afafaf" }}>
                  {daysToNext} day{daysToNext !== 1 ? "s" : ""} to unlock <strong style={{ color: stage.color }}>{nextStage.emoji} {nextStage.label}</strong>
                </div>
              )}
            </div>
          </div>

          {/* 28-Day Grid */}
          <div style={{ background: "white", borderRadius: "20px", border: "2px solid #eeeeee", padding: "28px", marginBottom: "28px" }}>
            <div style={{ fontWeight: "700", fontSize: "13px", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>28-DAY JOURNEY</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: "11px", fontWeight: "700", color: "#afafaf", marginBottom: "4px" }}>{d}</div>
              ))}
              {days.map((day) => (
                <div key={day.dayNum} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <DayDot status={day.checked ? "done" : day.active ? "active" : "empty"} />
                  <div style={{ fontSize: "10px", color: "#afafaf" }}>{day.dayNum}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", display: "flex", gap: "20px", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#58cc02" }} /> Complete</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ffc107" }} /> Today</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#eeeeee" }} /> Upcoming</div>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {[
              { label: "Days Complete",    value: totalDaysLogged,  unit: "days",     color: "#58cc02", emoji: "✅" },
              { label: "Cravings Tracked", value: totalCravings,    unit: "logged",   color: "#ffc107", emoji: "⚡" },
              { label: "Longest Streak",   value: data.longestStreak ?? 0, unit: "days", color: "#a855f7", emoji: "🏆" },
            ].map(({ label, value, unit, color, emoji }) => (
              <div key={label} style={{ background: "white", border: "2px solid #eeeeee", borderRadius: "18px", padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{emoji}</div>
                <div style={{ fontSize: "32px", fontWeight: "900", color }}>{value}</div>
                <div style={{ fontSize: "11px", color: "#afafaf", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{unit}</div>
                <div style={{ fontSize: "12px", color: "#afafaf", marginTop: "4px" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Plant stages legend */}
          <div style={{ background: "white", border: "2px solid #eeeeee", borderRadius: "20px", padding: "28px", marginTop: "28px" }}>
            <div style={{ fontWeight: "700", fontSize: "13px", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>GROWTH MILESTONES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {GARDEN_STAGES.map((s) => (
                <div key={s.minDays} style={{ display: "flex", alignItems: "center", gap: "16px", opacity: streak >= s.minDays ? 1 : 0.4 }}>
                  <div style={{ fontSize: "28px", width: "36px", textAlign: "center" }}>{s.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: streak >= s.minDays ? "#1f1f1f" : "#afafaf" }}>{s.label}</div>
                    <div style={{ fontSize: "12px", color: "#afafaf" }}>Unlocks at {s.minDays} days</div>
                  </div>
                  {streak >= s.minDays && <div style={{ fontSize: "13px", fontWeight: "700", color: s.color }}>✓ UNLOCKED</div>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <style jsx>{`
        @keyframes gentleBob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%       { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </main>
  );
}
