import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Washing Detector",
  description:
    "Paste a layoff announcement or earnings transcript - we score how plausibly the AI claim holds up. Roles cut, US labour pool, code-gen reality check, activist pressure. Free, no login.",
  openGraph: {
    title: "AI-Washing Detector",
    description:
      "Score any AI-replaced-jobs claim 0-100. Receipts based on roles named, what AI can actually do, US labour data and activist-pressure signals.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Washing Detector",
    description:
      "Score any AI-replaced-jobs claim 0-100. Free, public data only.",
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
