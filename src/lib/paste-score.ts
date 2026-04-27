// Paste-mode scoring. Operates on free-form text (layoff announcement,
// LinkedIn post, earnings transcript) rather than an SEC filing.
//
// The score is a 0-100 plausibility score. Higher = the AI-replaced-our-team
// claim is more plausible. Lower = looks more like AI washing dressed over a
// classic restructuring / cost-out story.

import { findRoles, findPressureSignals, codeGenSenseCheck, RoleFinding, PressureFinding } from "./roles";

// AI-claim patterns - explicit narratives that AI displaced jobs.
const AI_CLAIM_STRONG =
  /\b(ai (replaced|took over|displaced|made redundant|eliminated)|replaced (.{0,30})with ai|automated away|ai (agents?|systems?|tools?) (now|replace|do|handle) (the )?(work|jobs?|roles?))\b/gi;

const AI_CLAIM_WEAK =
  /\b(due to ai|because of ai|driven by ai|ai[- ]driven|leveraging ai|ai[- ]powered transformation|ai will (replace|handle|do))\b/gi;

// Specific tool / model citations - if real names are dropped, the claim
// has more substance than a generic AI hand-wave.
const SPECIFIC_TOOL_CITATIONS =
  /\b(claude(\s+(opus|sonnet|haiku|\d))?|chatgpt|gpt[- ]?[345]|gpt[- ]?\d|copilot|cursor|devin|gemini|llama|mistral|anthropic|openai|databricks|snowflake cortex|hugging ?face)\b/gi;

const LAYOFF_TALK =
  /\b(layoff|laid off|workforce reduction|reduction in force|\brif\b|severance|headcount reduction|let go|cuts? \d+|cutting (\d+|staff|jobs?|positions?)|made redundant|redundanc(y|ies))\b/gi;

const SUBSTANCE_SIGNAL =
  /\b(deployed (to|in) production|in production for (\d+|several) (months?|quarters?|years?)|measured (productivity|throughput|tickets?|cases?) (gains?|reduction|improvement)|automation rate|tickets? deflected|cases? resolved|response time (improved|reduced)|cost per (ticket|case|seat) (down|reduced)|saved \$?\d+(\.\d+)?\s?(m|million|k|thousand))\b/gi;

function countMatches(text: string, regex: RegExp, max = 5000): number {
  const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    n++;
    if (re.lastIndex === m.index) re.lastIndex++;
    if (n >= max) break;
  }
  return n;
}

export type PasteScore = {
  // 0-100 plausibility - higher = AI displacement claim is more plausible
  plausibilityScore: number;
  verdict: string;
  oneLiner: string;
  receipts: string[];
  signals: {
    aiClaimStrong: number;
    aiClaimWeak: number;
    specificToolCitations: number;
    layoffMentions: number;
    substanceSignals: number;
    totalWords: number;
  };
  roles: RoleFinding[];
  pressure: PressureFinding[];
  codeGenFlag: string | null;
};

export function scorePaste(rawText: string): PasteScore {
  const text = rawText.trim();
  const totalWords = text.split(/\s+/).length;

  const aiClaimStrong = countMatches(text, AI_CLAIM_STRONG);
  const aiClaimWeak = countMatches(text, AI_CLAIM_WEAK);
  const specificToolCitations = countMatches(text, SPECIFIC_TOOL_CITATIONS);
  const layoffMentions = countMatches(text, LAYOFF_TALK);
  const substanceSignals = countMatches(text, SUBSTANCE_SIGNAL);

  const roles = findRoles(text);
  const pressure = findPressureSignals(text);
  const codeGenFlag = codeGenSenseCheck(text);

  // Plausibility model (starts at 50, neutral)
  let p = 50;

  // Specific tool / model citation: real receipts. +12 each, capped.
  p += Math.min(20, specificToolCitations * 6);

  // Substance signals: deployment, measured outcomes. +5 each, capped.
  p += Math.min(20, substanceSignals * 5);

  // Roles mentioned shift the score by their AI-replaceability.
  // Each role contributes (replaceability - 50) * 0.2 weighted by mentions.
  for (const r of roles.slice(0, 5)) {
    const weight = Math.min(3, Math.log(1 + r.mentions));
    p += ((r.aiReplaceable - 50) / 100) * 14 * weight;
  }

  // Pressure signals subtract from plausibility - if there is restructuring
  // / activist / margin language, the cuts were probably going to happen
  // regardless of AI.
  p -= Math.min(25, pressure.reduce((sum, ps) => sum + Math.min(10, ps.mentions * 3), 0));

  // Strong AI claim with no substance and no specific tool citations is
  // suspicious - the claim is bigger than the receipts.
  if (aiClaimStrong > 0 && substanceSignals === 0 && specificToolCitations === 0) {
    p -= 15;
  }

  // Code-gen claim about engineers - extra penalty
  if (codeGenFlag) {
    p -= 12;
  }

  // Vague AI talk with layoffs and no roles named - classic washing pattern
  if (aiClaimWeak > 0 && layoffMentions > 0 && roles.length === 0) {
    p -= 10;
  }

  // No AI claim at all - score is meaningless, return neutral
  if (aiClaimStrong === 0 && aiClaimWeak === 0) {
    p = 50;
  }

  const plausibilityScore = Math.max(0, Math.min(100, Math.round(p)));

  let verdict: string;
  let oneLiner: string;
  if (aiClaimStrong === 0 && aiClaimWeak === 0) {
    verdict = "No AI claim detected";
    oneLiner = "We could not find an AI-replaced-jobs claim in this text.";
  } else if (plausibilityScore >= 75) {
    verdict = "Plausible";
    oneLiner = "The AI displacement claim has receipts. Specific tools, measured outcomes, or roles AI can credibly do.";
  } else if (plausibilityScore >= 50) {
    verdict = "Mixed signals";
    oneLiner = "AI is part of the story but the claim is bigger than the evidence presented here.";
  } else if (plausibilityScore >= 25) {
    verdict = "Suspicious";
    oneLiner = "Looks more like a cost-cutting story with an AI label on top.";
  } else {
    verdict = "AI Washing";
    oneLiner = "Classic AI-washing pattern - loud AI claim, restructuring or pressure context, no substance.";
  }

  const receipts: string[] = [];
  if (specificToolCitations > 0) {
    receipts.push(`${specificToolCitations} specific AI tool/model citation${specificToolCitations === 1 ? "" : "s"} - real receipts.`);
  } else if (aiClaimStrong > 0 || aiClaimWeak > 0) {
    receipts.push("No specific AI tool or model named. The claim is generic.");
  }
  if (substanceSignals > 0) {
    receipts.push(`${substanceSignals} substance signal${substanceSignals === 1 ? "" : "s"} found - measured outcomes, deployment, or savings.`);
  } else if (aiClaimStrong > 0 || aiClaimWeak > 0) {
    receipts.push("No measured outcomes or deployment timeline cited. The claim is unfalsifiable.");
  }
  for (const r of roles.slice(0, 4)) {
    receipts.push(
      `${r.label}: mentioned ${r.mentions}x. AI can plausibly replace ~${r.aiReplaceable}% of this work today (US labour pool: ~${r.usSupplyK}k).`,
    );
  }
  for (const ps of pressure) {
    receipts.push(`${ps.label} detected (${ps.mentions}x): "${ps.exampleMatch}".`);
  }
  if (codeGenFlag) {
    receipts.push(codeGenFlag);
  }
  if (layoffMentions > 0 && roles.length === 0) {
    receipts.push("Layoffs mentioned but no specific role categories named - opaque cuts.");
  }

  return {
    plausibilityScore,
    verdict,
    oneLiner,
    receipts,
    signals: {
      aiClaimStrong,
      aiClaimWeak,
      specificToolCitations,
      layoffMentions,
      substanceSignals,
      totalWords,
    },
    roles,
    pressure,
    codeGenFlag,
  };
}
