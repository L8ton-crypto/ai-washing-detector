// SEC EDGAR helpers. No auth needed. Requires a descriptive User-Agent.
// Docs: https://www.sec.gov/os/accessing-edgar-data

const UA =
  "AI-Washing Detector research (contact: info@leightonrice.co.uk)";

type Ticker = { cik_str: number; ticker: string; title: string };

let tickerCache: { at: number; rows: Ticker[] } | null = null;

async function fetchTickers(): Promise<Ticker[]> {
  const now = Date.now();
  if (tickerCache && now - tickerCache.at < 12 * 60 * 60 * 1000) {
    return tickerCache.rows;
  }
  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": UA, "Accept-Encoding": "gzip, deflate" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`EDGAR tickers fetch failed: ${res.status}`);
  const data = (await res.json()) as Record<string, Ticker>;
  const rows = Object.values(data);
  tickerCache = { at: now, rows };
  return rows;
}

export function padCik(cik: number | string): string {
  return String(cik).padStart(10, "0");
}

export async function resolveTicker(input: string): Promise<Ticker | null> {
  const q = input.trim().toUpperCase();
  if (!q) return null;
  const rows = await fetchTickers();

  // exact ticker match
  const exact = rows.find((r) => r.ticker.toUpperCase() === q);
  if (exact) return exact;

  // exact title match
  const title = rows.find((r) => r.title.toUpperCase() === q);
  if (title) return title;

  // starts-with on title
  const starts = rows.find((r) => r.title.toUpperCase().startsWith(q));
  if (starts) return starts;

  // contains on title (first 1)
  const contains = rows.find((r) => r.title.toUpperCase().includes(q));
  if (contains) return contains;

  return null;
}

type SubmissionFiling = {
  accessionNumber: string[];
  filingDate: string[];
  reportDate: string[];
  form: string[];
  primaryDocument: string[];
  primaryDocDescription: string[];
};

export type FilingRef = {
  accession: string;
  accessionNoDashes: string;
  form: string;
  filingDate: string;
  reportDate: string;
  primaryDoc: string;
  url: string;
};

export async function getLatestAnnualFiling(
  cik: string,
): Promise<FilingRef | null> {
  const res = await fetch(
    `https://data.sec.gov/submissions/CIK${cik}.json`,
    { headers: { "User-Agent": UA }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`EDGAR submissions fetch failed: ${res.status}`);
  const data = (await res.json()) as {
    filings: { recent: SubmissionFiling };
  };
  const r = data.filings.recent;
  // Prefer 10-K, fallback to 10-K/A, 20-F (foreign private issuers), then 10-Q
  const priorities = ["10-K", "10-K/A", "20-F", "20-F/A", "10-Q", "10-Q/A"];
  for (const form of priorities) {
    for (let i = 0; i < r.form.length; i++) {
      if (r.form[i] === form) {
        const accession = r.accessionNumber[i];
        const accessionNoDashes = accession.replace(/-/g, "");
        const primaryDoc = r.primaryDocument[i];
        const url = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNoDashes}/${primaryDoc}`;
        return {
          accession,
          accessionNoDashes,
          form,
          filingDate: r.filingDate[i],
          reportDate: r.reportDate[i],
          primaryDoc,
          url,
        };
      }
    }
  }
  return null;
}

// Hard limit on filing body size. EDGAR 10-Ks are usually 1-5 MB. 25 MB is a
// generous ceiling that prevents an absurdly large filing from blowing out the
// serverless function memory.
const MAX_FILING_BYTES = 25 * 1024 * 1024;

function isAllowedFilingHost(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return host === "www.sec.gov" || host === "data.sec.gov" || host === "sec.gov";
  } catch {
    return false;
  }
}

export async function fetchFilingText(url: string): Promise<string> {
  // SSRF guard: only allow fetches to SEC EDGAR hosts. URLs are constructed
  // from EDGAR JSON, but we never want this helper turned into a generic
  // proxy if someone changes the calling code later.
  if (!isAllowedFilingHost(url)) {
    throw new Error("Filing URL is not on an allowed SEC EDGAR host");
  }
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Encoding": "gzip, deflate" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Filing fetch failed: ${res.status}`);
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX_FILING_BYTES) {
    throw new Error("Filing exceeds size limit");
  }
  const raw = await res.text();
  if (raw.length > MAX_FILING_BYTES) {
    throw new Error("Filing body exceeds size limit");
  }
  return stripHtml(raw);
}

// Crude but adequate HTML stripper for EDGAR filings.
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
