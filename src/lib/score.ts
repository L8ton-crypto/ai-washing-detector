// AI-Washing scoring heuristic.
//
// Idea: take a public filing text. Count three buckets of signals:
//   1. AI talk: generic AI marketing language (AI, artificial intelligence,
//      machine learning, LLM, copilot, generative AI, neural network, ML,
//      deep learning).
//   2. Layoff / restructuring talk: workforce reductions, severance,
//      restructuring charges, RIF, headcount reduction.
//   3. AI substance signals: AI revenue, AI customers, AI bookings, hiring AI
//      engineers / researchers, launched / shipped AI products, trained
//      models, GPU / compute spend.
//
// The washing score rewards AI talk that is NOT backed by substance signals,
// and further amplifies when paired with layoff talk. The result is a 0-100
// integer where higher means more washing.
//
// This is a heuristic, not a judgement. We expose the raw counts in the
// response so readers can draw their own conclusions.

export type ScoreBucket = {
  label: string;
  pattern: RegExp;
  hits: { match: string; context: string }[];
};

const CONTEXT_WINDOW = 140; // chars either side

function matchWithContext(text: string, regex: RegExp, max = 6) {
  const hits: { match: string; context: string }[] = [];
  const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null && hits.length < max) {
    const start = Math.max(0, m.index - CONTEXT_WINDOW);
    const end = Math.min(text.length, m.index + m[0].length + CONTEXT_WINDOW);
    hits.push({
      match: m[0],
      context: "..." + text.slice(start, end).trim() + "...",
    });
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  return hits;
}

function countMatches(text: string, regex: RegExp): number {
  const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    n++;
    // Guard against zero-width matches that would otherwise loop forever.
    if (re.lastIndex === m.index) re.lastIndex++;
    if (n > 5000) break; // safety
  }
  return n;
}

const AI_TALK =
  /\b(artificial intelligence|generative ai|\bgen[- ]?ai\b|\bai[- ]powered\b|\bai[- ]driven\b|\bai[- ]enabled\b|\bai[- ]first\b|\bai[- ]native\b|\bai capabilities\b|\bai solutions?\b|\bai strategy\b|\bai transformation\b|\bai platform\b|\bai agents?\b|large language models?|\bllms?\b|machine learning|deep learning|neural networks?|\bcopilot\b)\b/gi;

const LAYOFF_TALK =
  /\b(layoff|laid off|workforce reduction|reduction in force|\brif\b|restructuring charge|severance|headcount reduction|reorganization|workforce optimization|cost reduction|efficiency initiatives?)\b/gi;

const REVENUE_SIGNAL =
  /\b(ai[- ]related revenue|revenue from ai|ai[- ]driven revenue|ai[- ]powered revenue|generative ai revenue|\bai arr\b|ai bookings|monetizing ai|ai monetization|ai subscription|ai[- ]related bookings|ai contribution to revenue)\b/gi;

const HIRING_SIGNAL =
  /\b(hired? ai (engineers?|researchers?|scientists?)|ai talent|expanded our ai team|growing our ai team|machine learning engineers?|ml engineers?|research scientists?)\b/gi;

const PRODUCT_SIGNAL =
  /\b(launched? (our|an|the) (ai|generative ai|ml|llm)|shipped (our|an|the) (ai|generative ai|ml|llm)|released (our|an|the) (ai|generative ai|ml|llm)|trained (our|a) (model|foundation model|language model)|\bgpu (spend|capacity|investment|cluster)|compute (spend|capacity|investment))\b/gi;

export function scoreFiling(text: string) {
  const words = text.split(/\s+/).length;
  const aiHits = countMatches(text, AI_TALK);
  const layoffHits = countMatches(text, LAYOFF_TALK);
  const revenueHits = countMatches(text, REVENUE_SIGNAL);
  const hiringHits = countMatches(text, HIRING_SIGNAL);
  const productHits = countMatches(text, PRODUCT_SIGNAL);

  const substance = revenueHits * 3 + hiringHits * 1 + productHits * 1;
  // Density of AI talk per 10k words, capped
  const aiDensity = Math.min(60, (aiHits / Math.max(1, words / 10000)) * 1);
  // Missing substance penalty - if AI talk is loud but substance is quiet
  const ratio = substance === 0 ? aiHits : aiHits / Math.max(1, substance);
  const noSubstancePenalty = Math.min(25, ratio * 2);
  // Layoff amplifier - AI talk + layoffs is classic washing pattern
  const layoffAmp = Math.min(15, layoffHits * 2);
  // Substance discount
  const substanceDiscount = Math.min(30, substance * 1.2);

  let raw = aiDensity + noSubstancePenalty + layoffAmp - substanceDiscount;
  if (aiHits === 0) raw = 0;
  const washingScore = Math.max(0, Math.min(100, Math.round(raw)));

  let verdict: string;
  if (aiHits === 0) verdict = "No AI narrative detected";
  else if (washingScore >= 70) verdict = "High AI-washing signal";
  else if (washingScore >= 45) verdict = "Moderate AI-washing signal";
  else if (washingScore >= 20) verdict = "Mixed - some substance";
  else verdict = "Low washing - substance present";

  const evidence = {
    aiTalkSamples: matchWithContext(text, AI_TALK, 5),
    layoffSamples: matchWithContext(text, LAYOFF_TALK, 3),
    revenueSignalSamples: matchWithContext(text, REVENUE_SIGNAL, 3),
    hiringSignalSamples: matchWithContext(text, HIRING_SIGNAL, 3),
    productSignalSamples: matchWithContext(text, PRODUCT_SIGNAL, 3),
  };

  return {
    washingScore,
    verdict,
    counts: {
      aiMentions: aiHits,
      layoffMentions: layoffHits,
      revenueSignalMentions: revenueHits,
      hiringSignalMentions: hiringHits,
      productSignalMentions: productHits,
      totalWords: words,
    },
    evidence,
  };
}
