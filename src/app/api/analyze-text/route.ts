import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { ensureDb, getDb } from "@/lib/db";
import { scorePaste } from "@/lib/paste-score";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_TEXT_LEN = 60;
const MAX_TEXT_LEN = 30_000;
const MAX_LABEL_LEN = 80;
const EXCERPT_LEN = 320;

function clientKey(req: NextRequest): string {
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anon";
}

function sanitiseLabel(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input.trim().replace(/[\r\n\t]+/g, " ").slice(0, MAX_LABEL_LEN);
  return cleaned.length > 0 ? cleaned : null;
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit("paste:" + clientKey(req), 12, 60 * 60 * 1000);
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
    const text = String(body?.text || "").trim();
    const label = sanitiseLabel(body?.label);

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (text.length < MIN_TEXT_LEN) {
      return NextResponse.json(
        { error: `Need at least ${MIN_TEXT_LEN} characters to score` },
        { status: 400 },
      );
    }
    if (text.length > MAX_TEXT_LEN) {
      return NextResponse.json(
        { error: `Text too long. Max ${MAX_TEXT_LEN} characters.` },
        { status: 400 },
      );
    }

    const scored = scorePaste(text);

    await ensureDb();
    const db = getDb();

    const textHash = createHash("sha256").update(text).digest("hex");
    const excerpt = text.slice(0, EXCERPT_LEN);

    const inserted = (await db`
      INSERT INTO aiwd_paste (
        text_hash, excerpt, label, plausibility_score, verdict, one_liner,
        receipts, role_findings, pressure_findings, signals, total_words
      ) VALUES (
        ${textHash}, ${excerpt}, ${label}, ${scored.plausibilityScore},
        ${scored.verdict}, ${scored.oneLiner},
        ${JSON.stringify(scored.receipts)},
        ${JSON.stringify(scored.roles)},
        ${JSON.stringify(scored.pressure)},
        ${JSON.stringify(scored.signals)},
        ${scored.signals.totalWords}
      )
      RETURNING id, created_at
    `) as { id: number; created_at: string }[];

    return NextResponse.json({
      id: inserted[0]?.id,
      label,
      plausibilityScore: scored.plausibilityScore,
      verdict: scored.verdict,
      oneLiner: scored.oneLiner,
      receipts: scored.receipts,
      signals: scored.signals,
      roles: scored.roles,
      pressure: scored.pressure,
      codeGenFlag: scored.codeGenFlag,
      shareUrl: `/card/${inserted[0]?.id}`,
    });
  } catch (err) {
    console.error("analyze-text error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Try again in a moment." },
      { status: 500 },
    );
  }
}
