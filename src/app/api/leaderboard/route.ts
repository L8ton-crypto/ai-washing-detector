import { NextResponse } from "next/server";
import { ensureDb, getDb } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    await ensureDb();
    const db = getDb();

    // Most-washed this week - one row per company (best = latest scan)
    const worstWeek = (await db`
      WITH latest AS (
        SELECT DISTINCT ON (cik)
          id, ticker, cik, company_name, washing_score, verdict, filing_date,
          filing_url, created_at
        FROM aiw_scans
        WHERE created_at > NOW() - INTERVAL '7 days'
        ORDER BY cik, created_at DESC
      )
      SELECT * FROM latest
      ORDER BY washing_score DESC, created_at DESC
      LIMIT 10
    `) as Array<{
      id: number;
      ticker: string;
      cik: string;
      company_name: string;
      washing_score: number;
      verdict: string;
      filing_date: string;
      filing_url: string;
      created_at: string;
    }>;

    const totalScans = (await db`
      SELECT COUNT(*)::int AS n FROM aiw_scans
    `) as { n: number }[];

    const recent = (await db`
      SELECT id, ticker, company_name, washing_score, verdict, created_at
      FROM aiw_scans
      ORDER BY created_at DESC
      LIMIT 12
    `) as Array<{
      id: number;
      ticker: string;
      company_name: string;
      washing_score: number;
      verdict: string;
      created_at: string;
    }>;

    return NextResponse.json({
      worstWeek,
      recent,
      totalScans: totalScans[0]?.n ?? 0,
    });
  } catch (err) {
    console.error("leaderboard error:", err);
    return NextResponse.json(
      { error: "Could not load leaderboard" },
      { status: 500 },
    );
  }
}
