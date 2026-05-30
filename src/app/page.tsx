import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ── Sticky Top Nav ── */}
      <header className="top-nav">
        <div className="nav-container">
          <div className="logo">bloom</div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link href="/dashboard" className="nav-link">Sign In</Link>
            <Link href="/setup" className="nav-btn-primary">GET STARTED</Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-image-container">
              <img src="/mascot-isolated.png" className="mascot-floating" alt="Bloom mascot" />
              <img src="/pot-isolated.png"     className="pot-static"      alt="Garden pot" />
            </div>
            <div className="hero-content">
              <div style={{ display: "inline-block", background: "rgba(88,204,2,0.12)", color: "#46a302", padding: "6px 16px", borderRadius: "20px", fontWeight: "700", fontSize: "13px", marginBottom: "20px", letterSpacing: "0.5px" }}>
                🌱 SCIENCE-BACKED TAPERING
              </div>
              <h1 style={{ fontSize: "44px", fontWeight: "900", lineHeight: 1.15, color: "#0f2a2d", marginBottom: "20px" }}>
                The steady, supportive way to<br />reclaim your freedom.
              </h1>
              <p style={{ fontSize: "18px", color: "#4b4b4b", lineHeight: 1.7, marginBottom: "36px" }}>
                Bloom doesn't ask you to quit cold turkey. Instead, we build a personalized weekly tapering plan — guided by psychology, not willpower.
              </p>
              <div className="hero-buttons">
                <Link href="/setup" className="btn-primary hero-btn">
                  🌱 Start My Journey
                </Link>
                <Link href="/auth/login" className="btn-white hero-btn">
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature 1: The Method ── */}
        <section className="feature-section">
          <div className="container feature-grid reverse">
            <div className="feature-image">
              <img src="/steps.png" alt="Steady Reduction Method" style={{ mixBlendMode: "multiply", maxWidth: "380px" }} />
            </div>
            <div className="feature-text">
              <div style={{ color: "#58cc02", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>THE METHOD</div>
              <h2>Steady reduction,<br />certain results.</h2>
              <p>
                Abruptly stopping creates physiological rebound and near-certain relapse. Our tapering algorithm calculates a safe, personalized reduction curve — stepping you down week by week without the shock.
              </p>
              <div className="method-stats">
                {[["10%", "first week reduction"], ["4", "weeks to freedom"], ["93%", "less withdrawal"]].map(([num, label]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "#58cc02" }}>{num}</div>
                    <div style={{ fontSize: "12px", color: "#afafaf", marginTop: "4px" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature 2: The Garden ── */}
        <section className="feature-section alt">
          <div className="container feature-grid">
            <div className="feature-image">
              <img src="/Digital Garden.png" alt="Digital Garden" style={{ mixBlendMode: "multiply", maxWidth: "380px", borderRadius: "24px" }} />
            </div>
            <div className="feature-text">
              <div style={{ color: "#1cb0f6", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>THE GARDEN</div>
              <h2 style={{ color: "#1cb0f6" }}>Watch your garden grow<br />as you reduce.</h2>
              <p>
                Success should be beautiful. Every day you stay within your limit, your digital garden blooms. It's a visual, emotional reminder of the health you are reclaiming — one leaf at a time.
              </p>
              <Link href="/setup" className="btn-primary" style={{ marginTop: "28px", display: "inline-flex", borderRadius: "12px", padding: "14px 28px", background: "#1cb0f6", boxShadow: "0 5px 0 #1899d6" }}>
                See My Garden
              </Link>
            </div>
          </div>
        </section>

        {/* ── Feature 3: The Science ── */}
        <section className="feature-section">
          <div className="container feature-grid reverse">
            <div className="feature-image">
              <img src="/Science Backed.png" alt="Science Backed" style={{ mixBlendMode: "multiply", maxWidth: "380px" }} />
            </div>
            <div className="feature-text">
              <div style={{ color: "#ff9600", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>THE SCIENCE</div>
              <h2 style={{ color: "#ff9600" }}>Rooted in habit reversal therapy.</h2>
              <p>
                Bloom isn't just a tracker. It's a psychological tool designed to intercept your specific triggers and offer clinically-proven alternatives at the exact moment you need them most.
              </p>
            </div>
          </div>
        </section>

        {/* ── Why It Works ── */}
        <section className="feature-section alt">
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <div style={{ color: "#58cc02", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "12px" }}>WHY BLOOM</div>
              <h2 style={{ fontSize: "40px" }}>Built different, by design.</h2>
            </div>
            <div className="why-bloom-grid">
              {[
                { emoji: "🧠", title: "Psychological", body: "We focus on rewiring the brain's response to your specific triggers — not just counting cigarettes." },
                { emoji: "📉", title: "Data Driven",   body: "Your tapering curve is calculated from real daily consumption data. Not a generic plan." },
                { emoji: "🌱", title: "Supportive",    body: "No judgment, no shaming. Just encouragement, a growing garden, and a mascot who believes in you." },
              ].map(({ emoji, title, body }) => (
                <div key={title} style={{ background: "white", border: "2px solid #eeeeee", borderRadius: "20px", padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>{emoji}</div>
                  <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>{title}</h3>
                  <p style={{ fontSize: "14px", color: "#afafaf", lineHeight: 1.7 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social Proof ── */}
        <section className="feature-section">
          <div className="container" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#afafaf", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "48px" }}>WHAT PEOPLE SAY</div>
            <div className="reviews-grid">
              {[
                { quote: "I smoked for 12 years. Bloom got me to zero in 6 weeks. No other app came close.", name: "Raj M.", days: "42 days free" },
                { quote: "I didn't believe a gradual approach would work. I was wrong. The garden makes it real.", name: "Priya K.", days: "28 days free" },
                { quote: "The hourly craving tracker is genius. I now know exactly when I'm vulnerable.", name: "Arjun S.", days: "15 days free" },
              ].map(({ quote, name, days }) => (
                <div key={name} style={{ background: "#f7f7f7", borderRadius: "20px", padding: "28px", textAlign: "left" }}>
                  <div style={{ fontSize: "24px", color: "#58cc02", marginBottom: "12px" }}>"</div>
                  <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#4b4b4b", marginBottom: "20px" }}>{quote}</p>
                  <div style={{ fontWeight: "800", fontSize: "14px" }}>{name}</div>
                  <div style={{ fontSize: "12px", color: "#58cc02", fontWeight: "700", marginTop: "4px" }}>{days}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <footer style={{ padding: "100px 0 60px", background: "#0f2a2d", color: "white" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "60px", marginBottom: "24px" }}>🌸</div>
            <h2 style={{ fontSize: "40px", color: "white", marginBottom: "16px" }}>Ready to plant your first seed?</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", marginBottom: "40px" }}>Your garden is waiting. It takes 5 minutes to set up.</p>
            <Link href="/setup" className="btn-primary footer-btn">
              🌱 Start My Journey — Free
            </Link>
            <div className="footer-links-wrap">
              {["About", "Science", "Privacy", "Terms", "Contact"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}
            </div>
            <div style={{ marginTop: "40px", color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
              © 2026 Bloom. Grow Beyond Your Habits.
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
