import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bloom — Grow Beyond Your Habits",
  description: "The steady, science-backed way to reduce and quit addictions. Personalized tapering plans, hourly craving tracking, and a supportive growth journey.",
  keywords: "quit smoking, reduce drinking, habit reduction, addiction recovery, tapering plan",
  openGraph: {
    title: "Bloom — Grow Beyond Your Habits",
    description: "Science-backed habit reduction that actually works.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
