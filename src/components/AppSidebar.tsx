"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  loadBloom, saveBloom, getDailyTarget, HABIT_ACTION,
  HABIT_LOG_LABEL, todayKey, getOrInitDay, getTodayCount,
  getDaysSince, clearBloom
} from "@/lib/bloom-db";
import { getAuthClient } from "@/lib/auth-client";
import { createClient as createBrowserSupabaseClient, isBrowserAuthConfigured } from "@/lib/supabase-browser";

const NAV_ITEMS = [
  { id: "LEARN", icon: "🗺️", label: "LEARN", path: "/dashboard" },
  { id: "GARDEN", icon: "🌻", label: "GARDEN", path: "/garden" },
  { id: "PROFILE", icon: "👤", label: "PROFILE", path: "/profile" },
];

function Toast({ msg }: { msg: string }) {
  return (
    <div className="bloom-toast">
      {msg}
    </div>
  );
}

interface AppSidebarProps {
  activeNav: "LEARN" | "GARDEN" | "PROFILE";
}

function getSidebarSnapshot() {
  const data = loadBloom();
  if (!data) {
    return { logLabel: "Log Smoking", quickCount: null };
  }
  const today = todayKey();
  const dayNum = getDaysSince(data.startDate) + 1;
  return {
    logLabel: HABIT_LOG_LABEL[data.habit] ?? "Log Usage",
    quickCount: { count: getTodayCount(data, today), target: getDailyTarget(data.quantity, dayNum) },
  };
}

export function AppSidebar({ activeNav }: AppSidebarProps) {
  const router = useRouter();
  const initial = getSidebarSnapshot();
  const [toast, setToast] = useState<string | null>(null);
  const [logLabel, setLogLabel] = useState<string>(initial.logLabel);
  const [quickCount, setQuickCount] = useState<{ count: number; target: number } | null>(initial.quickCount);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const next = getSidebarSnapshot();
      setLogLabel(next.logLabel);
      setQuickCount(next.quickCount);
    };
    window.addEventListener("bloom_update", refresh);
    return () => window.removeEventListener("bloom_update", refresh);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAuthState = async () => {
      if (!isBrowserAuthConfigured()) {
        if (isMounted) setIsAuthenticated(false);
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (isMounted) setIsAuthenticated(Boolean(user));
      } catch {
        if (isMounted) setIsAuthenticated(false);
      }
    };

    loadAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Craving Bell ── */
  const logCraving = () => {
    const d = loadBloom();
    if (!d) return;
    const today = todayKey();
    const day = getOrInitDay(d, today);
    const now = new Date();
    day.cravings.push({ timestamp: Date.now(), hour: now.getHours(), minute: now.getMinutes() });
    saveBloom(d);
    setIsMobileMenuOpen(false);
    showToast("⚡ Craving logged! The urge peaks in 3 min — then fades. Breathe.");
  };

  /* ── Quick +1 Log ── */
  const quickLog = () => {
    const d = loadBloom();
    if (!d) return;
    const today = todayKey();
    const day = getOrInitDay(d, today);
    day.usages.push({ timestamp: Date.now(), amount: 1 });
    saveBloom(d);
    setIsMobileMenuOpen(false);

    const dayNum = Math.floor((Date.now() - new Date(d.startDate).getTime()) / 86400000) + 1;
    const target = getDailyTarget(d.quantity, dayNum);
    const count = getTodayCount(d, today);
    const action = HABIT_ACTION[d.habit] ?? "Logged";

    if (count > target) {
      showToast(`⚠️ ${count} / ${target} today — over limit. We've noted it. Stay honest.`);
    } else if (count === target) {
      showToast(`🎉 ${target} reached — that's your goal! Not one more today.`);
    } else {
      const left = target - count;
      showToast(`${action} · ${count}/${target} today — ${left} left. You're on track.`);
    }
  };

  const activeColor = (() => {
    if (!quickCount) return "#58cc02";
    if (quickCount.count > quickCount.target) return "#ff4b4b";
    if (quickCount.count === quickCount.target) return "#ffc107";
    return "#58cc02";
  })();

  return (
    <>
      <button
        className="bloom-sidebar-toggle"
        type="button"
        aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen((value) => !value)}
      >
        {isMobileMenuOpen ? "X" : "☰"}
      </button>

      {isMobileMenuOpen && (
        <button
          className="bloom-sidebar-overlay"
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`bloom-sidebar ${isMobileMenuOpen ? "bloom-sidebar-open" : ""}`} style={{
        width: "248px", borderRight: "2px solid #eeeeee",
        padding: "28px 16px", position: "fixed", height: "100vh",
        zIndex: 100, backgroundColor: "white", display: "flex",
        flexDirection: "column", userSelect: "none",
      }}>
        {/* Logo */}
        <div className="bloom-sidebar-logo" onClick={() => router.push("/")} style={{ fontSize: "28px", fontWeight: "900", color: "#58cc02", letterSpacing: "-1.5px", marginBottom: "36px", padding: "0 8px", cursor: "pointer" }}>
          bloom
        </div>

        {/* Nav */}
        <nav className="bloom-sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button className="bloom-sidebar-nav-btn" key={item.id} onClick={() => {
                router.push(item.path);
                setIsMobileMenuOpen(false);
              }} style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "13px 16px", borderRadius: "12px",
                border: isActive ? "2px solid #84d8ff" : "2px solid transparent",
                borderBottom: isActive ? "4px solid #84d8ff" : "2px solid transparent",
                backgroundColor: isActive ? "#ddf4ff" : "transparent",
                color: isActive ? "#1cb0f6" : "#afafaf",
                fontWeight: "700", fontSize: "14px",
                cursor: "pointer", transition: "all 0.15s ease",
                textTransform: "uppercase", letterSpacing: "0.5px", width: "100%",
              }}>
                <span style={{ fontSize: "20px" }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Mini progress strip */}
        {quickCount && (
          <div className="bloom-sidebar-progress" style={{ margin: "0 4px 10px", padding: "12px 14px", borderRadius: "12px", background: "#f7f7f7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#afafaf", textTransform: "uppercase", letterSpacing: "0.5px" }}>Today</span>
              <span style={{ fontSize: "13px", fontWeight: "900", color: activeColor }}>
                {quickCount.count} / {quickCount.target}
              </span>
            </div>
            <div style={{ height: "6px", background: "#e5e5e5", borderRadius: "6px" }}>
              <div style={{ width: `${Math.min(100, (quickCount.count / quickCount.target) * 100)}%`, height: "100%", background: activeColor, borderRadius: "6px", transition: "width 0.4s ease, background 0.3s" }} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bloom-sidebar-actions" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 4px", marginTop: "4px" }}>
          <button className="bloom-sidebar-action" onClick={logCraving} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "13px 16px", borderRadius: "14px",
            backgroundColor: "#58cc02", color: "white",
            border: "none", borderBottom: "4px solid #46a302",
            fontWeight: "700", fontSize: "13px", cursor: "pointer",
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}
            onMouseDown={e => { e.currentTarget.style.transform = "translateY(4px)"; e.currentTarget.style.borderBottom = "0px solid #46a302"; }}
            onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderBottom = "4px solid #46a302"; }}>
            <img src="/Craving Bell.png" alt="" style={{ width: "24px", objectFit: "contain" }} />
            I Have a Craving
          </button>

          <button className="bloom-sidebar-action" onClick={quickLog} style={{
            padding: "13px 16px", borderRadius: "14px",
            backgroundColor: "white", color: "#4b4b4b",
            border: "2px solid #e5e5e5", borderBottom: "4px solid #e5e5e5",
            fontWeight: "700", fontSize: "13px", cursor: "pointer",
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}
            onMouseDown={e => { e.currentTarget.style.transform = "translateY(4px)"; e.currentTarget.style.borderBottom = "0px solid #e5e5e5"; }}
            onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderBottom = "4px solid #e5e5e5"; }}>
            {logLabel} +1
          </button>

          {/* Sign Out */}
          {isAuthenticated ? (
            <button
              className="bloom-sidebar-signout"
              onClick={async () => {
                await getAuthClient().signOut();
                clearBloom();
                setIsAuthenticated(false);
                router.push("/auth/login");
              }}
              style={{
                padding: "10px 16px", borderRadius: "12px",
                backgroundColor: "transparent", color: "#afafaf",
                border: "2px solid transparent",
                fontWeight: "600", fontSize: "12px", cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              Sign Out
            </button>
          ) : (
            <button
              className="bloom-sidebar-signout"
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push("/auth/login");
              }}
              style={{
                padding: "10px 16px", borderRadius: "12px",
                backgroundColor: "transparent", color: "#afafaf",
                border: "2px solid transparent",
                fontWeight: "600", fontSize: "12px", cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Action Bar */}
      <div className="bloom-mobile-action-bar">
        <button className="bloom-mobile-action-btn craving" onClick={logCraving}>
          <img src="/Craving Bell.png" alt="" style={{ width: "20px", objectFit: "contain" }} />
          I HAVE A CRAVING
        </button>
        <button className="bloom-mobile-action-btn log" onClick={quickLog}>
          {logLabel} +1
        </button>
      </div>

      {toast && <Toast msg={toast} />}

      <style jsx>{`
        @keyframes sbFadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .bloom-toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          background: #1f1f1f;
          color: white;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          z-index: 9999;
          animation: sbFadeUp 0.3s ease-out;
          box-shadow: 0 8px 30px rgba(0,0,0,0.25);
          white-space: nowrap;
          max-width: 90vw;
        }

        .bloom-mobile-action-bar {
          display: none;
        }

        @media (max-width: 767px) {
          .bloom-mobile-action-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-top: 1px solid #eeeeee;
            padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 12px)) 16px;
            gap: 12px;
            z-index: 150;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
          }

          .bloom-mobile-action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 10px;
            border-radius: 14px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
            transition: transform 0.1s;
          }

          .bloom-mobile-action-btn.craving {
            background-color: #58cc02;
            color: white;
            border-bottom: 4px solid #46a302;
          }
          .bloom-mobile-action-btn.craving:active {
            transform: translateY(4px);
            border-bottom-width: 0px;
            margin-bottom: 4px;
          }

          .bloom-mobile-action-btn.log {
            background-color: white;
            color: #4b4b4b;
            border: 2px solid #e5e5e5;
            border-bottom: 4px solid #e5e5e5;
          }
          .bloom-mobile-action-btn.log:active {
            transform: translateY(4px);
            border-bottom-width: 0px;
            margin-bottom: 4px;
          }
          
          .bloom-toast {
            bottom: 120px;
          }
        }
      `}</style>
    </>
  );
}
