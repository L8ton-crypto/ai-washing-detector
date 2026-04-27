import Link from "next/link";

export const metadata = {
  title: "About - AI-Washing Detector",
};

export default function About() {
  return (
    <main className="min-h-screen px-4 sm:px-6 pb-16 text-gray-200">
      <div className="max-w-3xl mx-auto pt-10 sm:pt-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
          {"<-"} Back to detector
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-white">
          How the score works
        </h1>
        <div className="mt-6 space-y-5 text-gray-400 leading-relaxed">
          <p>
            AI-Washing Detector has two modes. Paste mode scores any free-form
            text - a layoff announcement, an earnings transcript, a LinkedIn
            post claiming &ldquo;AI replaced our team.&rdquo; Ticker mode pulls
            the latest 10-K or 10-Q for a US-listed company from SEC EDGAR.
          </p>

          <h2 className="text-xl font-semibold text-white pt-2">
            Paste-mode plausibility (0-100)
          </h2>
          <p>
            We start neutral at 50 and shift the score based on what we find
            in the text:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="text-emerald-300 font-medium">+ Specific tool citations</span>
              : Claude, GPT, Cursor, Copilot, internal model names. Real receipts move the score up.
            </li>
            <li>
              <span className="text-emerald-300 font-medium">+ Substance signals</span>
              : measured outcomes, deployment timelines, savings, deflection rates.
            </li>
            <li>
              <span className="text-amber-300 font-medium">~ Roles named</span>
              : we match against a curated role table with AI-replaceability
              scores informed by what current AI tools can actually do, plus
              rough US labour-pool size from BLS OEWS.
            </li>
            <li>
              <span className="text-red-300 font-medium">- Pressure signals</span>
              : activist investors, margin pressure, missed guidance,
              restructuring language. These suggest the cuts had a non-AI driver.
            </li>
            <li>
              <span className="text-red-300 font-medium">- Code-gen sense check</span>
              : claims that AI replaced engineers get extra scrutiny. Code-gen
              tools augment engineers today, autonomous end-to-end shipping is still rare.
            </li>
          </ul>
          <p>
            High score = the claim has receipts. Low score = looks like AI
            washing dressed over a classic restructuring story.
          </p>

          <h2 className="text-xl font-semibold text-white pt-2">
            Ticker-mode washing score (0-100)
          </h2>
          <p>
            We pull the most recent annual or quarterly filing for a US-listed
            company from SEC EDGAR. No login, no scraping, no private APIs.
            Filings are public. We then count three categories of phrases:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="text-amber-300 font-medium">AI talk</span>:
              generic marketing language around AI, ML, LLMs, copilots, generative AI.
            </li>
            <li>
              <span className="text-red-300 font-medium">Layoff talk</span>:
              workforce reductions, restructuring charges, severance, headcount reduction.
            </li>
            <li>
              <span className="text-emerald-300 font-medium">Substance signals</span>
              : AI-related revenue, AI hiring, trained models, GPU capacity, product launches.
            </li>
          </ul>
          <p>
            The washing score rewards loud AI talk with no substance, and
            further amplifies when layoff talk is present.
          </p>

          <h2 className="text-xl font-semibold text-white pt-4">Caveats</h2>
          <p>
            This is a keyword heuristic, not a judgement and not investment
            advice. Read the source text before drawing conclusions. The role
            replaceability scores reflect a single point in time and will move
            as AI tooling matures.
          </p>
          <p>
            Built by Leighton Rice. Contact:{" "}
            <a
              href="mailto:info@leightonrice.co.uk"
              className="text-emerald-400 hover:underline underline-offset-2"
            >
              info@leightonrice.co.uk
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
