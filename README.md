# AI-Washing Detector

Score any US-listed company on how much its AI talk is backed by real AI signals. Pulls the latest 10-K or 10-Q from SEC EDGAR, counts buzzword mentions, cross-checks against hiring, product, and revenue disclosures.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4 (dark, mobile-first)
- Neon Postgres via @neondatabase/serverless, ensureDb pattern
- Vercel Analytics + Speed Insights

## Data source

SEC EDGAR public APIs. No auth required - just a descriptive User-Agent.

- Ticker lookup: https://www.sec.gov/files/company_tickers.json
- Submissions: https://data.sec.gov/submissions/CIK{cik}.json
- Filings served from https://www.sec.gov/Archives/edgar/data/...

## Env vars

```
DATABASE_URL=postgresql://...
```

## Routes

- `GET /` - Home page with analyzer and live leaderboard
- `GET /about` - Scoring methodology
- `POST /api/analyze` - Body `{ ticker: string }`. Returns score + evidence.
- `GET /api/leaderboard` - Most-washed this week + recent scans.

## Scoring

Heuristic score 0-100:

- AI talk density per 10k words (capped)
- No-substance penalty (AI talk ÷ substance signals)
- Layoff amplifier (AI talk + layoff = classic washing)
- Substance discount (real AI revenue/hiring/product signals)

See `src/lib/score.ts` for the exact regexes and weights.
