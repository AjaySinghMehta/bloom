"use client";

import { useState, useEffect } from "react";

const ALTERNATIVES = [
  "Try eating a small piece of dark chocolate.",
  "Drink a large glass of cold water.",
  "Take 10 deep breaths—in for 4, hold for 4, out for 4.",
  "Do 5 jumping jacks to get your heart rate up.",
  "Chew some sugar-free gum.",
  "Text a friend just to say hi.",
];

export default function TriggerNotification({ triggers }: { triggers: string[] }) {
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const [alternative, setAlternative] = useState("");

  useEffect(() => {
    const checkTriggers = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (triggers.includes(currentTime) && !activeTrigger) {
        setActiveTrigger(currentTime);
        setAlternative(ALTERNATIVES[Math.floor(Math.random() * ALTERNATIVES.length)]);
      }
    };

    const interval = setInterval(checkTriggers, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [triggers, activeTrigger]);

  if (!activeTrigger) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "40px",
      right: "40px",
      zIndex: 1000,
      animation: "slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    }}>
      <div className="card" style={{ 
        maxWidth: "320px", 
        border: "3px solid var(--primary-orange)",
        boxShadow: "0 8px 0 var(--primary-orange-dark)",
        background: "white"
      }}>
        <h4 style={{ color: "var(--primary-orange)", marginBottom: "8px" }}>Trigger Alert! 🕒</h4>
        <p style={{ fontSize: "14px", marginBottom: "16px" }}>
          You usually smoke around this time. Instead of that, why not:
        </p>
        <div style={{ 
          background: "var(--bg-offwhite)", 
          padding: "12px", 
          borderRadius: "12px", 
          marginBottom: "16px",
          fontWeight: "600",
          fontSize: "15px",
          color: "var(--dark-gray)"
        }}>
          "{alternative}"
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "12px" }} onClick={() => setActiveTrigger(null)}>
            I'll try this!
          </button>
          <button className="btn" style={{ padding: "8px 16px", fontSize: "12px" }} onClick={() => setActiveTrigger(null)}>
            Dismiss
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
