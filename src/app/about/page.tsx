import Link from "next/link";

export const metadata = {
  title: "About - AI-Washing Detector",
};

export default function About() {
  return (
    <main className="min-h-screen px-4 sm:px-6 pb-16 text-gray-200">
      <div className="max-w-3xl mx-auto pt-10 sm:pt-16">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          {"<-"} Back to detector
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-white">
          How the score works
        </h1>
        <div className="mt-6 space-y-5 text-gray-400 leading-relaxed">
          <p>
            AI-Washing Detector pulls the most recent annual or quarterly
            filing for a US-listed company from SEC EDGAR. No login, no
            scraping, no private APIs. Filings are public.
          </p>
          <p>
            We then count three categories of phrases in the filing text:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="text-amber-300 font-medium">AI talk</span>:
              generic marketing language around AI, ML, LLMs, copilots,
              generative AI.
            </li>
            <li>
              <span className="text-red-300 font-medium">Layoff talk</span>:
              workforce reductions, restructuring charges, severance,
              headcount reduction.
            </li>
            <li>
              <span className="text-emerald-300 font-medium">
                Substance signals
              </span>
              : AI-related revenue, AI hiring, trained models, GPU capacity,
              product launches.
            </li>
          </ul>
          <p>
            The washing score rewards loud AI talk with no substance, and
            further amplifies when layoff talk is present. A low score means
            the company is putting real AI money where its mouth is. A high
            score means the AI narrative is not backed up by the numbers.
          </p>
          <h2 className="text-xl font-semibold text-white pt-4">Caveats</h2>
          <p>
            This is a keyword heuristic, not investment advice. A 10-K is
            written by lawyers for risk disclosure, so heavy AI mentions often
            appear in risk-factor sections. Read the source filing before
            drawing conclusions. Every result links directly to the SEC.
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
