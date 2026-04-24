import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // Avoid throwing at import-time on build machines that lack env; only throw when used.
  console.warn("DATABASE_URL not set - DB features will fail at request time");
}

let initPromise: Promise<void> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return neon(process.env.DATABASE_URL);
}

async function runInit() {
  const db = getDb();
  await db`
    CREATE TABLE IF NOT EXISTS aiw_scans (
      id SERIAL PRIMARY KEY,
      ticker TEXT NOT NULL,
      cik TEXT NOT NULL,
      company_name TEXT NOT NULL,
      filing_accession TEXT NOT NULL,
      filing_date DATE,
      filing_url TEXT,
      ai_mentions INTEGER NOT NULL DEFAULT 0,
      layoff_mentions INTEGER NOT NULL DEFAULT 0,
      revenue_signal_mentions INTEGER NOT NULL DEFAULT 0,
      hiring_signal_mentions INTEGER NOT NULL DEFAULT 0,
      product_signal_mentions INTEGER NOT NULL DEFAULT 0,
      total_words INTEGER NOT NULL DEFAULT 0,
      washing_score INTEGER NOT NULL DEFAULT 0,
      verdict TEXT NOT NULL,
      evidence JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await db`
    CREATE INDEX IF NOT EXISTS idx_aiw_scans_ticker ON aiw_scans(ticker)
  `;
  await db`
    CREATE INDEX IF NOT EXISTS idx_aiw_scans_created ON aiw_scans(created_at DESC)
  `;
  await db`
    CREATE INDEX IF NOT EXISTS idx_aiw_scans_score ON aiw_scans(washing_score DESC)
  `;
}

export async function ensureDb() {
  if (!initPromise) {
    initPromise = runInit().catch((err) => {
      // Reset so the next request can try again instead of being permanently broken.
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}
