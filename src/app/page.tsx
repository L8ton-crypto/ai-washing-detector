"use client";

import { useCallback, useEffect, useState } from "react";

type AnalyzeResponse = {
  id: number;
  ticker: string;
  company: string;
  cik: string;
  filing: {
    form: string;
    accession: string;
    filingDate: string;
    reportDate: string;
    url: string;
  };
  score: number;
  verdict: string;
  counts: {
    aiMentions: number;
    layoffMentions: number;
    revenueSignalMentions: number;
    hiringSignalMentions: number;
    productSignalMentions: number;
    totalWords: number;
  };
  evidence: {
    aiTalkSamples: { match: string; context: string }[];
    layoffSamples: { match: string; context: string }[];
    revenueSignalSamples: { match: string; context: string }[];
    hiringSignalSamples: { match: string; context: string }[];
    productSignalSamples: { match: string; context: string }[];
  };
};

type LeaderboardRow = {
  id: number;
  ticker: string;
  company_name: string;
  washing_score: number;
  verdict: string;
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-red-400";
  if (score >= 45) return "text-amber-400";
  if (score >= 20) return "text-yellow-300";
  return "text-emerald-400";
}

function scoreBg(score: number): string {
  if (score >= 70) return "bg-red-500/10 ring-red-500/30";
  if (score >= 45) return "bg-amber-500/10 ring-amber-500/30";
  if (score >= 20) return "bg-yellow-500/10 ring-yellow-500/30";
  return "bg-emerald-500/10 ring-emerald-500/30";
}

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [worstWeek, setWorstWeek] = useState<LeaderboardRow[]>([]);
  const [totalScans, setTotalScans] = useState<number>(0);

  const loadBoard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setWorstWeek(data.worstWeek || []);
      setTotalScans(data.totalScans || 0);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading) return;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: input.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        setResult(data);
        loadBoard();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, loadBoard],
  );

  const quickPick = (t: string) => {
    setInput(t);
  };

  return (
    <main className="min-h-screen px-4 sm:px-6 pb-16">
      <header className="max-w-4xl mx-auto pt-10 sm:pt-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-3 h-3 rounded-full bg-emerald-400">
            <span className="pulse-ring absolute inset-0 rounded-full bg-emerald-400/60" />
          </div>
          <span className="text-xs uppercase tracking-widest text-gray-400">
            SEC EDGAR data, public filings only
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
          AI-Washing Detector
        </h1>
        <p className="mt-4 text-gray-400 text-base sm:text-lg max-w-2xl">
          Score any US-listed company on how much its AI talk is backed by real
          AI signals. We pull the latest 10-K or 10-Q from SEC EDGAR, count
          buzzword mentions, then cross-check against hiring, product, and
          revenue disclosures.
        </p>
      </header>

      <section className="max-w-4xl mx-auto mt-8 sm:mt-12">
        <form
          onSubmit={submit}
          className="flex flex-col sm:flex-row gap-3 items-stretch"
        >
          <input
            type="text"
            inputMode="text"
            placeholder="Ticker or company (MSFT, Oracle, IBM...)"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            maxLength={80}
            aria-label="Company ticker or name"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg px-6 py-3 font-medium bg-emerald-500 text-black hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
          >
            {loading ? "Analyzing filing..." : "Analyze"}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="text-gray-500 mr-1">Try:</span>
          {["MSFT", "GOOGL", "META", "ORCL", "CRM", "IBM", "SNOW", "C3AI"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => quickPick(t)}
              className="px-2 py-1 rounded border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {result && <ResultCard result={result} />}
      </section>

      <section className="max-w-4xl mx-auto mt-14">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Most-washed this week
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Updated live from this site&apos;s public scans. {totalScans} total scans on record.
            </p>
          </div>
        </div>
        {worstWeek.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-6 text-gray-500 text-sm">
            No scans in the last 7 days. Be the first - analyze a company above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-800 rounded-lg border border-gray-800 bg-gray-900/40">
            {worstWeek.map((row, idx) => (
              <li
                key={row.id}
                className="flex items-center justify-between px-4 py-3 gap-3"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-gray-600 tabular-nums w-6">{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">
                      {row.ticker}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {row.company_name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold tabular-nums ${scoreColor(row.washing_score)}`}>
                    {row.washing_score}
                  </div>
                  <div className="text-xs text-gray-500">{row.verdict}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="max-w-4xl mx-auto mt-16 text-xs text-gray-500 space-y-2">
        <p>
          Data: SEC EDGAR company filings (10-K, 10-K/A, 20-F, 10-Q). Scoring
          is a keyword-based heuristic, not investment advice.
        </p>
        <p>
          Built by{" "}
          <a
            className="text-gray-300 underline-offset-2 hover:underline"
            href="https://www.linkedin.com/in/leighton-rice/"
            target="_blank"
            rel="noopener"
          >
            Leighton Rice
          </a>
          . Inspired by the finding that a large share of AI-attributed layoffs
          come from companies with no disclosed AI revenue.
        </p>
      </footer>
    </main>
  );
}

function buildLinkedInPost(r: AnalyzeResponse): string {
  const substance =
    r.counts.revenueSignalMentions +
    r.counts.hiringSignalMentions +
    r.counts.productSignalMentions;
  const ratio =
    substance === 0 && r.counts.aiMentions > 0
      ? "infinity"
      : substance > 0
        ? (r.counts.aiMentions / substance).toFixed(1)
        : "0";

  let opener: string;
  if (r.score >= 70) {
    opener = `${r.company} (${r.ticker}) is running an AI narrative the numbers do not support.`;
  } else if (r.score >= 45) {
    opener = `${r.company} (${r.ticker}) talks AI loud, but the substance is patchy.`;
  } else if (r.score >= 20) {
    opener = `${r.company} (${r.ticker}) sits in the middle: real AI work, but the marketing is louder than the proof.`;
  } else if (r.counts.aiMentions === 0) {
    opener = `${r.company} (${r.ticker}) barely mentions AI in its latest filing. No hype, no theatre.`;
  } else {
    opener = `${r.company} (${r.ticker}) is putting AI money where its mouth is.`;
  }

  const lines = [
    opener,
    "",
    `Latest ${r.filing.form}, filed ${r.filing.filingDate}.`,
    "",
    `AI talk: ${r.counts.aiMentions} mentions`,
    `Layoff talk: ${r.counts.layoffMentions} mentions`,
    `AI revenue signals: ${r.counts.revenueSignalMentions}`,
    `AI hiring signals: ${r.counts.hiringSignalMentions}`,
    `AI product signals: ${r.counts.productSignalMentions}`,
    `Talk-to-substance ratio: ${ratio}`,
    "",
    `Washing Score: ${r.score}/100 - ${r.verdict}`,
    "",
    `Source filing: ${r.filing.url}`,
    "",
    `Run your own scan at ai-washing-detector.vercel.app`,
    "",
    `#AI #SECEDGAR #AIWashing #PublicData`,
  ];

  return lines.join("\n");
}

function ResultCard({ result }: { result: AnalyzeResponse }) {
  const r = result;
  const substance =
    r.counts.revenueSignalMentions +
    r.counts.hiringSignalMentions +
    r.counts.productSignalMentions;
  const [postOpen, setPostOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const post = buildLinkedInPost(r);

  const copyPost = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(post);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [post]);

  return (
    <div className="mt-8 space-y-5">
      <div
        className={`rounded-xl ring-1 ${scoreBg(r.score)} p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap`}
      >
        <div className="min-w-0">
          <div className="text-sm text-gray-400">
            {r.company} <span className="text-gray-600">({r.ticker})</span>
          </div>
          <div className="mt-1 text-lg sm:text-xl font-medium text-white truncate">
            {r.verdict}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Latest {r.filing.form} filed {r.filing.filingDate} - {" "}
            <a
              className="underline-offset-2 hover:underline text-gray-400"
              href={r.filing.url}
              target="_blank"
              rel="noopener"
            >
              view source
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-5xl sm:text-6xl font-semibold tabular-nums ${scoreColor(r.score)}`}>
            {r.score}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
            Washing Score
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="AI mentions" value={r.counts.aiMentions} tone="amber" />
        <Stat label="Layoff talk" value={r.counts.layoffMentions} tone="red" />
        <Stat label="Words scanned" value={r.counts.totalWords} tone="gray" />
        <Stat label="AI revenue signals" value={r.counts.revenueSignalMentions} tone="emerald" />
        <Stat label="AI hiring signals" value={r.counts.hiringSignalMentions} tone="emerald" />
        <Stat label="AI product signals" value={r.counts.productSignalMentions} tone="emerald" />
      </div>

      {substance === 0 && r.counts.aiMentions > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          AI talk detected but no AI revenue, hiring, or product signals found
          in the filing. Classic washing pattern.
        </div>
      )}

      <div className="rounded-lg border border-gray-800 bg-gray-900/40">
        <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-sm font-medium text-white">
              LinkedIn-ready post
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Built from this scan. Edit before posting.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPostOpen((v) => !v)}
              className="rounded-md px-3 py-1.5 text-xs font-medium border border-gray-700 text-gray-200 hover:border-gray-500"
            >
              {postOpen ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={copyPost}
              className="rounded-md px-3 py-1.5 text-xs font-medium bg-emerald-500 text-black hover:bg-emerald-400"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        {postOpen && (
          <pre className="px-4 pb-4 text-xs text-gray-300 whitespace-pre-wrap break-words font-mono">
{post}
          </pre>
        )}
      </div>

      <EvidenceGroup
        title="AI talk samples"
        samples={r.evidence.aiTalkSamples}
        tone="amber"
      />
      <EvidenceGroup
        title="Layoff / restructuring samples"
        samples={r.evidence.layoffSamples}
        tone="red"
      />
      <EvidenceGroup
        title="AI revenue signals"
        samples={r.evidence.revenueSignalSamples}
        tone="emerald"
      />
      <EvidenceGroup
        title="AI hiring signals"
        samples={r.evidence.hiringSignalSamples}
        tone="emerald"
      />
      <EvidenceGroup
        title="AI product signals"
        samples={r.evidence.productSignalSamples}
        tone="emerald"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "red" | "emerald" | "gray";
}) {
  const color =
    tone === "amber"
      ? "text-amber-300"
      : tone === "red"
        ? "text-red-300"
        : tone === "emerald"
          ? "text-emerald-300"
          : "text-gray-300";
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-1">
        {label}
      </div>
    </div>
  );
}

function EvidenceGroup({
  title,
  samples,
  tone,
}: {
  title: string;
  samples: { match: string; context: string }[];
  tone: "amber" | "red" | "emerald";
}) {
  if (!samples || samples.length === 0) return null;
  const hl =
    tone === "amber"
      ? "text-amber-300"
      : tone === "red"
        ? "text-red-300"
        : "text-emerald-300";
  return (
    <details className="rounded-lg border border-gray-800 bg-gray-900/40">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-white">
        {title} <span className="text-gray-500">({samples.length})</span>
      </summary>
      <ul className="px-4 pb-4 space-y-3 text-sm text-gray-300">
        {samples.map((s, i) => (
          <li key={i} className="leading-relaxed">
            <span className={`${hl} font-semibold`}>{s.match}</span>
            <span className="ml-2 text-gray-400">{s.context}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
