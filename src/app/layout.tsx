import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Washing Detector",
  description:
    "Score any public company on how much its AI talk is backed by real AI signals. Public data from SEC EDGAR filings.",
  openGraph: {
    title: "AI-Washing Detector",
    description:
      "Score any public company on how much its AI talk is backed by real AI signals.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-gray-100 antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
