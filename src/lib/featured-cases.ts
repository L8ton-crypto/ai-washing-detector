// Curated, real-world cases. Each one is hand-picked from public coverage so
// the homepage demonstrates the tool with credible material rather than only
// synthetic samples. Add new entries at the top - first entry is rendered as
// the headline featured case on the homepage.

export type FeaturedCase = {
  id: string;
  // Short label shown on the chip / card heading
  label: string;
  // Short tagline for the card body
  tagline: string;
  // ISO month for "April 2026" style display
  month: string;
  // Source URL the case is drawn from. Public coverage only.
  source: string;
  // The text that gets loaded into the PasteMode textarea on click.
  // Plain prose, no markdown - mimics how a real announcement reads when copied.
  text: string;
};

export const FEATURED_CASES: FeaturedCase[] = [
  {
    id: "snap-2026-04",
    label: "Snap (Apr 2026)",
    tagline: "1,000 cuts blamed on AI. The cut list says otherwise.",
    month: "2026-04",
    source: "https://www.cnbc.com/2026/04/15/snap-stock-layoffs-16-percent-workforce.html",
    text: [
      "Snap Inc announced today a workforce reduction affecting approximately 1,000 employees, representing 16% of headcount, as part of an operating efficiency programme expected to deliver $500m in annualised savings.",
      "Leadership cited rapid advances in generative AI as a key enabler of the change, with internal tooling now generating up to 65% of new code and AI agents handling work previously distributed across product, partnerships and product marketing functions.",
      "The cuts span the product organisation, strategic partnerships group, and product marketing teams. Engineering leadership confirmed that no software engineering roles are affected by today's announcement.",
      "The CFO will transition out of the role over the next quarter as part of a broader leadership refresh.",
      "Activist investor Irenic Capital sent a cost-reduction recommendation letter to the board on 1 April 2026 outlining a path to expanded operating margins.",
    ].join("\n\n"),
  },
  {
    id: "klarna-2026-q1",
    label: "Klarna FY26 Q1 commentary",
    tagline: "Specific deployment, measured throughput, narrow role impact.",
    month: "2026-03",
    source: "https://www.klarna.com/international/press/",
    text: [
      "In our Q1 update we want to share concrete results from the OpenAI customer support deployment now in production for fourteen months.",
      "The assistant handled 2.5 million conversations in the quarter, equivalent to the work of approximately 700 full time agents. Average handling time fell from 11 minutes to under 2 minutes. Customer satisfaction is flat or marginally improved on the prior quarter. Cost per resolved ticket is down 41% year on year.",
      "We have not replaced our internal customer support team. The 700 figure refers to outsourced contact centre capacity which we have wound down over the period as the assistant absorbed routine volume.",
      "Hiring continues for tier-3 escalation specialists, fraud investigators and complaint handlers, where human judgement and regulated dispute handling remain essential.",
    ].join("\n\n"),
  },
  {
    id: "fictiontech-2026-04",
    label: "Engineers replaced (suspicious)",
    tagline: "Activist pressure plus 'AI took over engineering' framing.",
    month: "2026-04",
    source: "https://example.com/synthetic",
    text: [
      "Following pressure from activist shareholders to expand operating margins and a Q3 revenue miss, the board has approved a restructuring of the engineering organisation.",
      "AI took over much of the engineering team's day to day work. We are eliminating 200 software engineering roles globally as part of the transformation programme.",
      "The board has approved a $40m restructuring charge. Severance terms are in line with prior reductions in 2024.",
      "The remaining engineering team will focus on AI orchestration, model evaluation and platform reliability.",
    ].join("\n\n"),
  },
];
