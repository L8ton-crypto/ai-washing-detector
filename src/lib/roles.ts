// Role taxonomy plus AI-replaceability scores.
//
// Each role gets a 0-100 ai_replaceable score. Higher means today's AI tools
// can plausibly do a meaningful chunk of the work. Lower means the role
// involves trust, accountability, regulated judgement or physical presence
// that current AI cannot replace.
//
// US labour supply rough order of magnitude (millions of workers in the US,
// 2024 BLS OEWS). Used as a sanity check - if a layoff claims "AI replaced
// our 200 recruiters" but there are 800k recruiters in the US labour pool,
// that is a tiny dent in supply, not an industry shift.
//
// Numbers are deliberately rough. The point is to expose them as receipts,
// not to be authoritative.

export type Role = {
  id: string;
  label: string;
  // Patterns that match this role in free text. Case-insensitive.
  patterns: RegExp[];
  // 0-100 - how much today's AI can plausibly displace this role.
  aiReplaceable: number;
  // Rough US labour supply, in thousands of workers (BLS OEWS scale).
  usSupplyK: number;
  // Short note explaining the replaceability score.
  reasoning: string;
};

export const ROLES: Role[] = [
  {
    id: "engineer",
    label: "Software engineers",
    patterns: [
      /\b(software (engineers?|developers?))\b/gi,
      /\b(swe|programmers?)\b/gi,
      /\bengineering team\b/gi,
    ],
    aiReplaceable: 25,
    usSupplyK: 1900,
    reasoning:
      "Code-gen tools speed up engineers but autonomous end-to-end shipping is still rare. Real headcount cuts here usually mean restructuring, not replacement.",
  },
  {
    id: "support",
    label: "Customer support",
    patterns: [
      /\bcustomer (support|service|success)\b/gi,
      /\bsupport (team|agents?|reps?|representatives)\b/gi,
      /\bservice desk\b/gi,
      /\bcontact cent(er|re)\b/gi,
      /\bhelp ?desk\b/gi,
    ],
    aiReplaceable: 70,
    usSupplyK: 2900,
    reasoning:
      "Tier-1 ticket triage and FAQ answering is genuinely automatable today. Tier-2/3 escalation still needs humans.",
  },
  {
    id: "recruiter",
    label: "Recruiters / talent",
    patterns: [
      /\brecruiters?\b/gi,
      /\btalent (acquisition|sourcing) (team|partners?)\b/gi,
      /\bsourcers?\b/gi,
    ],
    aiReplaceable: 60,
    usSupplyK: 800,
    reasoning:
      "Sourcing and screening can be automated. Closing candidates and managing offers is still a relationship job.",
  },
  {
    id: "marketing",
    label: "Marketing / content",
    patterns: [
      /\bmarket(ing|ers?)\b/gi,
      /\bcontent (writers?|teams?|marketers?|strategists?)\b/gi,
      /\bcopywriters?\b/gi,
      /\bsocial media (managers?|team)\b/gi,
    ],
    aiReplaceable: 55,
    usSupplyK: 700,
    reasoning:
      "Generative AI handles draft content and variations. Brand strategy, positioning and creative direction remain human.",
  },
  {
    id: "sales",
    label: "Sales",
    patterns: [
      /\bsales (reps?|team|representatives|associates?)\b/gi,
      /\baccount executives?\b/gi,
      /\bbdrs?\b/gi,
      /\bsdrs?\b/gi,
    ],
    aiReplaceable: 35,
    usSupplyK: 1400,
    reasoning:
      "AI assists with prospecting and outreach drafting. Closing complex deals is still relationship-driven.",
  },
  {
    id: "designer",
    label: "Designers",
    patterns: [
      /\b(graphic|product|ux|ui) designers?\b/gi,
      /\bdesigners?\b/gi,
      /\billustrators?\b/gi,
    ],
    aiReplaceable: 45,
    usSupplyK: 200,
    reasoning:
      "AI generates concepts and variations fast. System design, product strategy and brand work still need humans.",
  },
  {
    id: "translator",
    label: "Translators",
    patterns: [
      /\btranslators?\b/gi,
      /\btranslation (team|services|specialists?)\b/gi,
      /\blinguists?\b/gi,
    ],
    aiReplaceable: 80,
    usSupplyK: 80,
    reasoning:
      "Machine translation has been production-ready for a decade and LLMs raised the ceiling. Legal and literary translation still needs humans.",
  },
  {
    id: "data-entry",
    label: "Data entry / admin",
    patterns: [
      /\bdata entry (clerks?|specialists?|operators?)\b/gi,
      /\badministrative (assistants?|specialists?)\b/gi,
      /\bback[- ]office\b/gi,
      /\bclerks?\b/gi,
    ],
    aiReplaceable: 75,
    usSupplyK: 1800,
    reasoning:
      "Highly automatable. OCR plus LLM extraction handles most structured data work today.",
  },
  {
    id: "qa",
    label: "QA / testers",
    patterns: [
      /\bqa (engineers?|testers?|analysts?)\b/gi,
      /\bquality assurance\b/gi,
      /\btest engineers?\b/gi,
    ],
    aiReplaceable: 50,
    usSupplyK: 200,
    reasoning:
      "AI can generate test cases and find regressions. Exploratory testing and judgement calls are still human.",
  },
  {
    id: "analyst",
    label: "Analysts",
    patterns: [
      /\b(business|data|financial|research) analysts?\b/gi,
      /\banalysts?\b/gi,
    ],
    aiReplaceable: 40,
    usSupplyK: 1100,
    reasoning:
      "AI accelerates research and reporting. Stakeholder framing and judgement on what to investigate are still human.",
  },
  {
    id: "lawyer",
    label: "Legal / compliance",
    patterns: [
      /\blawyers?\b/gi,
      /\bparalegals?\b/gi,
      /\blegal (team|counsel)\b/gi,
      /\bcompliance (officers?|team|analysts?)\b/gi,
    ],
    aiReplaceable: 30,
    usSupplyK: 800,
    reasoning:
      "Doc review and discovery is automatable. Filed work, courtroom and regulated advice cannot be done by AI.",
  },
  {
    id: "ops",
    label: "Operations / project mgmt",
    patterns: [
      /\boperations (team|managers?|specialists?|associates?)\b/gi,
      /\bproject managers?\b/gi,
      /\bprogram managers?\b/gi,
      /\bproduct managers?\b/gi,
    ],
    aiReplaceable: 35,
    usSupplyK: 1200,
    reasoning:
      "AI helps with status reports and synthesis. Cross-team coordination and judgement remain human.",
  },
];

export type RoleFinding = {
  id: string;
  label: string;
  mentions: number;
  exampleMatch: string | null;
  aiReplaceable: number;
  usSupplyK: number;
  reasoning: string;
};

export function findRoles(text: string): RoleFinding[] {
  const out: RoleFinding[] = [];
  for (const role of ROLES) {
    let mentions = 0;
    let exampleMatch: string | null = null;
    for (const pat of role.patterns) {
      const re = new RegExp(pat.source, pat.flags.includes("g") ? pat.flags : pat.flags + "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        mentions += 1;
        if (!exampleMatch) exampleMatch = m[0];
        if (re.lastIndex === m.index) re.lastIndex++;
        if (mentions > 200) break;
      }
    }
    if (mentions > 0) {
      out.push({
        id: role.id,
        label: role.label,
        mentions,
        exampleMatch,
        aiReplaceable: role.aiReplaceable,
        usSupplyK: role.usSupplyK,
        reasoning: role.reasoning,
      });
    }
  }
  // Sort by mentions desc, then by ai-replaceability asc (most suspicious first)
  out.sort((a, b) => b.mentions - a.mentions || a.aiReplaceable - b.aiReplaceable);
  return out;
}

// Activist / cost-pressure phrases. These do not mean a layoff is washing
// per se, but they raise the priors that the cuts had a non-AI driver.
export const PRESSURE_PATTERNS: { id: string; label: string; pattern: RegExp }[] = [
  {
    id: "activist",
    label: "Activist investor pressure",
    pattern: /\b(activist (investor|shareholder|fund)|elliott management|starboard|engaged shareholder)\b/gi,
  },
  {
    id: "margin",
    label: "Margin / cost pressure",
    pattern: /\b(margin pressure|expand(ing)? margins?|operating margin|cost (cuts?|reduction|discipline|out)|efficiency (drive|push|initiative))\b/gi,
  },
  {
    id: "restructure",
    label: "Restructuring language",
    pattern: /\b(restructur\w*|transformation programme?|turnaround|business review)\b/gi,
  },
  {
    id: "guidance",
    label: "Missed guidance / weak earnings",
    pattern: /\b(missed (guidance|consensus|estimates)|softer than expected|lower than expected (revenue|earnings|growth))\b/gi,
  },
  {
    id: "investor",
    label: "Investor / board pressure",
    pattern: /\b(board pressure|under pressure from investors?|investors? have (called|demanded|pushed))\b/gi,
  },
];

export type PressureFinding = {
  id: string;
  label: string;
  mentions: number;
  exampleMatch: string | null;
};

export function findPressureSignals(text: string): PressureFinding[] {
  const out: PressureFinding[] = [];
  for (const p of PRESSURE_PATTERNS) {
    const re = new RegExp(p.pattern.source, p.pattern.flags.includes("g") ? p.pattern.flags : p.pattern.flags + "g");
    let mentions = 0;
    let exampleMatch: string | null = null;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      mentions += 1;
      if (!exampleMatch) exampleMatch = m[0];
      if (re.lastIndex === m.index) re.lastIndex++;
      if (mentions > 50) break;
    }
    if (mentions > 0) {
      out.push({ id: p.id, label: p.label, mentions, exampleMatch });
    }
  }
  return out;
}

// Code-gen sense check. If text claims engineers were replaced by AI, flag
// that engineers are still highly under-replaced today.
export function codeGenSenseCheck(text: string): string | null {
  const claimsEngineerReplacement =
    /\b((replaced|displaced|automated away|cut) (our )?(software )?engineers?|engineers? (were|are being) replaced|engineering team (was )?replaced|ai (took over|replaced|wrote) (the )?(code|engineering))/i.test(
      text,
    );
  if (claimsEngineerReplacement) {
    return "Specific claim: engineers replaced by AI. Reality check: code-gen tools currently augment engineers - autonomous shipping of production features end-to-end is still rare in 2026. This is the highest-friction claim to make plausibly.";
  }
  return null;
}
