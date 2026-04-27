import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ensureDb, getDb } from "@/lib/db";
import type { RoleFinding, PressureFinding } from "@/lib/roles";
import ShareCopy from "./share-copy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CardRow = {
  id: number;
  excerpt: string;
  label: string | null;
  plausibility_score: number;
  verdict: string;
  one_liner: string;
  receipts: string[] | null;
  role_findings: RoleFinding[] | null;
  pressure_findings: PressureFinding[] | null;
  signals: {
    aiClaimStrong: number;
    aiClaimWeak: number;
    specificToolCitations: number;
    layoffMentions: number;
    substanceSignals: number;
    totalWords: number;
  } | null;
  total_words: number;
  created_at: string;
};

async function fetchCard(id: string): Promise<CardRow | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0 || numId > 2_147_483_647) return null;
  try {
    await ensureDb();
    const db = getDb();
    const rows = (await db`
      SELECT id, excerpt, label, plausibility_score, verdict, one_liner,
             receipts, role_findings, pressure_findings, signals, total_words,
             created_at
      FROM aiwd_paste
      WHERE id = ${numId}
      LIMIT 1
    `) as CardRow[];
    return rows[0] || null;
  } catch (err) {
    console.error("fetchCard error:", err);
    return null;
  }
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-300";
  if (score >= 25) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-500/10 ring-emerald-500/30";
  if (score >= 50) return "bg-yellow-500/10 ring-yellow-500/30";
  if (score >= 25) return "bg-amber-500/10 ring-amber-500/30";
  return "bg-red-500/10 ring-red-500/30";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await fetchCard(id);
  if (!row) return { title: "AI-Washing Detector card" };
  const title = `${row.verdict} - score ${row.plausibility_score}/100 - AI-Washing Detector`;
  const description = row.one_liner;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: `/api/og/${row.id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/${row.id}`],
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await fetchCard(id);
  if (!row) notFound();

  const receipts = Array.isArray(row.receipts) ? row.receipts : [];
  const roles = Array.isArray(row.role_findings) ? row.role_findings : [];
  const pressure = Array.isArray(row.pressure_findings) ? row.pressure_findings : [];

  const created = new Date(row.created_at).toISOString().slice(0, 10);

  return (
    <main className="min-h-screen px-4 sm:px-6 pb-16 text-gray-200">
      <div className="max-w-3xl mx-auto pt-8 sm:pt-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
          {"<-"} Back to detector
        </Link>

        <article className={`mt-6 rounded-2xl ring-1 ${scoreBg(row.plausibility_score)} p-6 sm:p-8`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs uppercase tracking-widest text-gray-400">
              AI-Washing Detector / paste-mode scan
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
            {row.label || "Anonymous claim"}
          </h1>
          <div className="mt-2 text-xs text-gray-500">Scanned {created}</div>

          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Plausibility</div>
              <div className={`text-5xl sm:text-6xl font-semibold tabular-nums ${scoreColor(row.plausibility_score)}`}>
                {row.plausibility_score}
                <span className="text-2xl text-gray-600">/100</span>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Verdict</div>
              <div className="text-2xl sm:text-3xl font-medium text-white">{row.verdict}</div>
            </div>
          </div>

          <p className="mt-5 text-base sm:text-lg text-gray-300 leading-relaxed">
            {row.one_liner}
          </p>
        </article>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">The receipts</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-300">
            {receipts.length === 0 ? (
              <li className="text-gray-500">No specific signals captured.</li>
            ) : (
              receipts.map((r, i) => (
                <li key={i} className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                  {r}
                </li>
              ))
            )}
          </ul>
        </section>

        {roles.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-white">Roles named in the text</h2>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((r) => (
                <li key={r.id} className="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{r.label}</span>
                    <span className="text-xs text-gray-500 tabular-nums">
                      {r.mentions} mention{r.mentions === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    AI replaceability ~{r.aiReplaceable}% / US labour pool ~{r.usSupplyK}k
                  </div>
                  <div className="mt-2 text-xs text-gray-500 leading-relaxed">{r.reasoning}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pressure.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-white">Non-AI pressure signals</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              {pressure.map((p) => (
                <li key={p.id} className="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                  <span className="font-medium text-white">{p.label}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {p.mentions} mention{p.mentions === 1 ? "" : "s"}
                  </span>
                  {p.exampleMatch && (
                    <span className="ml-2 text-xs text-gray-500">
                      e.g. &ldquo;{p.exampleMatch}&rdquo;
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Excerpt analysed</h2>
          <blockquote className="mt-3 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3 text-sm text-gray-400 italic leading-relaxed">
            {row.excerpt}
            {row.total_words > 60 ? "..." : ""}
          </blockquote>
        </section>

        <section className="mt-10 rounded-lg border border-gray-800 bg-gray-900/30 p-5">
          <h3 className="text-sm font-semibold text-white">Share this</h3>
          <p className="mt-1 text-xs text-gray-500">
            Copy this URL into a LinkedIn post. The OG card auto-renders.
          </p>
          <ShareCopy id={row.id} />
        </section>

        <footer className="mt-10 text-xs text-gray-500 leading-relaxed">
          <p>
            Heuristic only - not an accusation, not investment advice. Built by{" "}
            <a className="text-gray-300 underline-offset-2 hover:underline" href="https://www.linkedin.com/in/leighton-rice/" target="_blank" rel="noopener">
              Leighton Rice
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
