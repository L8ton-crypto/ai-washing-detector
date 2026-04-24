import { NextRequest, NextResponse } from "next/server";
import { ensureDb, getDb } from "@/lib/db";
import { resolveTicker, padCik, getLatestAnnualFiling, fetchFilingText } from "@/lib/edgar";
import { scoreFiling } from "@/lib/score";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

function clientKey(req: NextRequest): string {
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anon";
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(clientKey(req), 12, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit reached. Try again in a bit." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rl.resetAt),
          },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const input = String(body?.ticker || "").trim();
    if (!input) {
      return NextResponse.json(
        { error: "Ticker or company name is required" },
        { status: 400 },
      );
    }
    if (input.length > 80) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    await ensureDb();

    const match = await resolveTicker(input);
    if (!match) {
      return NextResponse.json(
        { error: `No US-listed company found for "${input}"` },
        { status: 404 },
      );
    }

    const cik = padCik(match.cik_str);
    const filing = await getLatestAnnualFiling(cik);
    if (!filing) {
      return NextResponse.json(
        { error: "No recent annual or quarterly filing found on SEC EDGAR" },
        { status: 404 },
      );
    }

    const text = await fetchFilingText(filing.url);
    if (text.length < 2000) {
      return NextResponse.json(
        { error: "Filing body was too short to analyse" },
        { status: 422 },
      );
    }

    const scored = scoreFiling(text);

    const db = getDb();
    const inserted = (await db`
      INSERT INTO aiw_scans (
        ticker, cik, company_name, filing_accession, filing_date, filing_url,
        ai_mentions, layoff_mentions, revenue_signal_mentions,
        hiring_signal_mentions, product_signal_mentions, total_words,
        washing_score, verdict, evidence
      ) VALUES (
        ${match.ticker}, ${cik}, ${match.title},
        ${filing.accession}, ${filing.filingDate}, ${filing.url},
        ${scored.counts.aiMentions}, ${scored.counts.layoffMentions},
        ${scored.counts.revenueSignalMentions}, ${scored.counts.hiringSignalMentions},
        ${scored.counts.productSignalMentions}, ${scored.counts.totalWords},
        ${scored.washingScore}, ${scored.verdict}, ${JSON.stringify(scored.evidence)}
      )
      RETURNING id, created_at
    `) as { id: number; created_at: string }[];

    return NextResponse.json({
      id: inserted[0]?.id,
      ticker: match.ticker,
      company: match.title,
      cik,
      filing: {
        form: filing.form,
        accession: filing.accession,
        filingDate: filing.filingDate,
        reportDate: filing.reportDate,
        url: filing.url,
      },
      score: scored.washingScore,
      verdict: scored.verdict,
      counts: scored.counts,
      evidence: scored.evidence,
    });
  } catch (err) {
    console.error("analyze error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Try again in a moment." },
      { status: 500 },
    );
  }
}
