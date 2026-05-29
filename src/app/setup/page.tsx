"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBloom } from "@/lib/bloom-db";
import type { BloomJourney, HabitId } from "@/lib/bloom-types";

type Step = "HABIT" | "QUANTITY" | "LIFESTYLE" | "PSYCHOLOGY" | "GENERATING";
const STEPS: Step[] = ["HABIT", "QUANTITY", "LIFESTYLE", "PSYCHOLOGY", "GENERATING"];

const HABITS = [
  {
    id: "smoking",
    label: "Smoking",
    icon: "/icon_smoking.png",
    tagline: "Cigarettes, vaping, or tobacco",
    gradient: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
    glow: "rgba(238, 90, 36, 0.3)",
    accent: "#ee5a24",
  },
  {
    id: "drinking",
    label: "Drinking",
    icon: "/icon_drinking.png",
    tagline: "Alcohol in any form",
    gradient: "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)",
    glow: "rgba(108, 92, 231, 0.3)",
    accent: "#6c5ce7",
  },
  {
    id: "sugar",
    label: "Sugar",
    icon: "/icon_sugar.png",
    tagline: "Sweets, sodas & junk cravings",
    gradient: "linear-gradient(135deg, #fd79a8 0%, #e84393 100%)",
    glow: "rgba(232, 67, 147, 0.3)",
    accent: "#e84393",
  },
  {
    id: "digital",
    label: "Digital",
    icon: "/icon_digital.png",
    tagline: "Screens, social media & scrolling",
    gradient: "linear-gradient(135deg, #00cec9 0%, #0984e3 100%)",
    glow: "rgba(9, 132, 227, 0.3)",
    accent: "#0984e3",
  },
];

const HABIT_DEFAULTS: Record<string, { unit: string; quantity: number }> = {
  smoking: { unit: "cigarettes", quantity: 10 },
  drinking: { unit: "ml", quantity: 500 },
  sugar: { unit: "items", quantity: 3 },
  digital: { unit: "hours", quantity: 5 },
};

const TRIGGERS = [
  { id: "Stress",  label: "Stress or Anxiety",  desc: "Pressure builds and the urge hits.",           emoji: "😤" },
  { id: "Social",  label: "Social Situations",  desc: "Friends or crowds make it hard to say no.",    emoji: "👥" },
  { id: "Boredom", label: "Boredom",             desc: "Empty time turns into the habit.",             emoji: "😴" },
  { id: "Routine", label: "Daily Routine",       desc: "Tied to morning coffee, commute, or meals.",   emoji: "🔄" },
];

export default function SetupPage() {
  const router   = useRouter();
  const [step,      setStep]      = useState<Step>("HABIT");
  const [habit,     setHabit]     = useState("");
  const [quantity,  setQuantity]  = useState(10);
  const [unit,      setUnit]      = useState("");
  const [trigger,   setTrigger]   = useState("");
  const [wakeTime,  setWakeTime]  = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [drinkType, setDrinkType] = useState("");
  const [selected,  setSelected]  = useState<string | null>(null); // for click flash

  const selectedHabit = HABITS.find(h => h.id === habit);

  const savePlan = (selectedTrigger: string = trigger) => {
    if (!habit || !unit || !selectedTrigger) return;
    const journey: BloomJourney = {
      habit: habit as HabitId,
      quantity,
      unit,
      trigger: selectedTrigger,
      wakeTime,
      sleepTime,
      drinkType: drinkType || undefined,
      startDate: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      logs: {},
    };
    saveBloom(journey);
    router.push("/dashboard");
  };

  const stepIndex = STEPS.indexOf(step);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 18px", borderRadius: "14px",
    border: "2px solid #e5e5e5", fontSize: "16px", fontWeight: "500",
    outline: "none", fontFamily: "inherit", color: "#1f1f1f",
    backgroundColor: "white", transition: "border-color 0.2s",
  };

  const primaryBtn = (onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "16px", borderRadius: "16px",
        background: selectedHabit?.gradient ?? "linear-gradient(135deg, #58cc02, #46a302)",
        color: "white", fontWeight: "800", border: "none",
        fontSize: "15px", cursor: "pointer", letterSpacing: "0.08em",
        textTransform: "uppercase",
        boxShadow: `0 8px 24px ${selectedHabit?.glow ?? "rgba(88,204,2,0.35)"}`,
        transition: "transform 0.1s, box-shadow 0.1s",
        marginTop: "8px",
      }}
      onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.boxShadow = "none"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 8px 24px ${selectedHabit?.glow ?? "rgba(88,204,2,0.35)"}`; }}
    >
      {label}
    </button>
  );

  return (
    <main style={{ minHeight: "calc(100vh - 72px)", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>

      {/* Floating orbs background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(88,204,2,0.08) 0%, transparent 70%)", top: "-100px", left: "-100px", animation: "orb1 10s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(28,176,246,0.08) 0%, transparent 70%)", bottom: "-80px", right: "-80px", animation: "orb2 8s ease-in-out infinite" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "520px", position: "relative", zIndex: 1 }}>

        {/* Progress Bar */}
        {step !== "GENERATING" && (
          <div style={{ display: "flex", gap: "6px", marginBottom: "40px" }}>
            {STEPS.filter(s => s !== "GENERATING").map((s, i) => (
              <div key={s} style={{
                flex: 1, height: "6px", borderRadius: "6px",
                background: i < stepIndex ? "#58cc02" : i === stepIndex ? "#58cc02" : "#e5e5e5",
                opacity: i <= stepIndex ? 1 : 0.35,
                transition: "all 0.4s ease",
              }} />
            ))}
          </div>
        )}

        {/* ── STEP 1: HABIT ── */}
        {step === "HABIT" && (
          <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "10px" }}>What do you want to conquer?</h1>
              <p style={{ color: "#afafaf", fontSize: "16px" }}>Choose honestly. Every journey starts here.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {HABITS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    const defaults = HABIT_DEFAULTS[h.id];
                    setSelected(h.id);
                    setUnit(defaults.unit);
                    setQuantity(defaults.quantity);
                    setTimeout(() => { setHabit(h.id); setStep("QUANTITY"); setSelected(null); }, 300);
                  }}
                  style={{
                    padding: "0",
                    borderRadius: "20px",
                    border: "none",
                    background: "white",
                    cursor: "pointer",
                    overflow: "hidden",
                    boxShadow: selected === h.id
                      ? `0 0 0 3px ${h.accent}, 0 20px 40px ${h.glow}`
                      : "0 4px 20px rgba(0,0,0,0.06)",
                    transform: selected === h.id ? "scale(0.96)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Gradient top band */}
                  <div style={{ background: h.gradient, height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={h.icon} alt={h.label} style={{ width: "80px", height: "80px", objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.2))", animation: "iconBob 3s ease-in-out infinite" }} />
                  </div>
                  {/* Text area */}
                  <div style={{ padding: "18px 16px", textAlign: "center" }}>
                    <div style={{ fontWeight: "800", fontSize: "17px", color: "#1f1f1f", marginBottom: "4px" }}>{h.label}</div>
                    <div style={{ fontSize: "12px", color: "#afafaf", lineHeight: "1.4" }}>{h.tagline}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: QUANTITY ── */}
        {step === "QUANTITY" && (
          <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
            <button onClick={() => setStep("HABIT")} style={{ background: "none", border: "none", color: "#afafaf", cursor: "pointer", fontWeight: "700", fontSize: "14px", marginBottom: "28px", padding: 0 }}>← Back</button>
            <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>Daily usage?</h1>
            <p style={{ color: "#afafaf", fontSize: "15px", marginBottom: "32px" }}>Be honest — the AI needs real data to build a safe plan.</p>

            <div style={{ padding: "40px 36px", borderRadius: "24px", border: "2px solid #eeeeee", marginBottom: "20px", textAlign: "center", background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "64px", fontWeight: "900", color: selectedHabit?.accent ?? "#58cc02", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{quantity}</div>
              <div style={{ fontSize: "16px", color: "#afafaf", fontWeight: "600", marginTop: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{unit} / day</div>
              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                {[{ label: "−", delta: -1 }, { label: "+", delta: 1 }].map(({ label, delta }) => (
                  <button
                    key={label}
                    onClick={() => setQuantity(q => Math.max(0, q + delta))}
                    style={{ flex: 1, padding: "16px", borderRadius: "14px", border: "2px solid #eeeeee", borderBottom: "4px solid #eeeeee", fontWeight: "900", fontSize: "24px", cursor: "pointer", background: "white", transition: "all 0.1s" }}
                    onMouseDown={e => { e.currentTarget.style.transform = "translateY(4px)"; e.currentTarget.style.borderBottom = "2px solid #eeeeee"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderBottom = "4px solid #eeeeee"; }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {habit === "drinking" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "8px", fontSize: "14px", color: "#777" }}>Type of drink</label>
                <select value={drinkType} onChange={e => setDrinkType(e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {["Beer", "Whiskey", "Rum", "Wine"].map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                </select>
              </div>
            )}

            {primaryBtn(() => setStep("LIFESTYLE"), "Continue →")}
          </div>
        )}

        {/* ── STEP 3: LIFESTYLE ── */}
        {step === "LIFESTYLE" && (
          <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
            <button onClick={() => setStep("QUANTITY")} style={{ background: "none", border: "none", color: "#afafaf", cursor: "pointer", fontWeight: "700", fontSize: "14px", marginBottom: "28px", padding: 0 }}>← Back</button>
            <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>Your Active Hours</h1>
            <p style={{ color: "#afafaf", fontSize: "15px", marginBottom: "32px" }}>We'll map cravings to your real daily rhythm.</p>

            <div style={{ background: "white", borderRadius: "24px", padding: "32px", border: "2px solid #eeeeee", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {[
                { label: "🌅 Wake-up time", key: "wake", value: wakeTime, setter: setWakeTime },
                { label: "🌙 Sleep time",   key: "sleep", value: sleepTime, setter: setSleepTime },
              ].map(({ label, key, value, setter }) => (
                <div key={key}>
                  <label style={{ display: "block", fontWeight: "700", marginBottom: "10px", fontSize: "15px" }}>{label}</label>
                  <input type="time" value={value} onChange={e => setter(e.target.value)} style={{ ...inputStyle, fontSize: "24px", fontWeight: "800", textAlign: "center", color: selectedHabit?.accent ?? "#58cc02", padding: "18px" }} />
                </div>
              ))}
            </div>

            {primaryBtn(() => setStep("PSYCHOLOGY"), "Continue →")}
          </div>
        )}

        {/* ── STEP 4: PSYCHOLOGY ── */}
        {step === "PSYCHOLOGY" && (
          <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
            <button onClick={() => setStep("LIFESTYLE")} style={{ background: "none", border: "none", color: "#afafaf", cursor: "pointer", fontWeight: "700", fontSize: "14px", marginBottom: "28px", padding: 0 }}>← Back</button>
            <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>What drives the urge?</h1>
            <p style={{ color: "#afafaf", fontSize: "15px", marginBottom: "32px" }}>Identifying your trigger is the most powerful first step.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {TRIGGERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTrigger(t.id);
                    setStep("GENERATING");
                    setTimeout(() => savePlan(t.id), 2800);
                  }}
                  style={{
                    padding: "18px 22px", borderRadius: "18px",
                    border: "2px solid #eeeeee", borderBottom: "4px solid #eeeeee",
                    background: "white", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "18px",
                    textAlign: "left", transition: "all 0.15s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = selectedHabit?.accent ?? "#58cc02"; e.currentTarget.style.boxShadow = `0 4px 20px ${selectedHabit?.glow ?? "rgba(88,204,2,0.2)"}`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#eeeeee"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
                  onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
                  onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <span style={{ fontSize: "28px", lineHeight: 1 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontWeight: "800", fontSize: "16px", color: "#1f1f1f" }}>{t.label}</div>
                    <div style={{ fontSize: "13px", color: "#afafaf", marginTop: "3px" }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 5: GENERATING ── */}
        {step === "GENERATING" && (
          <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeInUp 0.4s ease-out" }}>
            <img src="/mascot-isolated.png" alt="Mascot" style={{ width: "200px", margin: "0 auto 32px", display: "block", animation: "mascotFloat 2s ease-in-out infinite" }} />
            <h2 style={{ fontSize: "24px", fontWeight: "900", marginBottom: "12px" }}>Calculating your reduction curve...</h2>
            <p style={{ color: "#afafaf", fontSize: "15px" }}>Analysing your triggers, schedule, and baseline.</p>
            <div style={{ marginTop: "32px", display: "flex", gap: "8px", justifyContent: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: selectedHabit?.accent ?? "#58cc02", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mascotFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes iconBob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%       { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(40px, 30px); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-30px, -20px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
