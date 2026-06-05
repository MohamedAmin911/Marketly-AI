import type { AIQualityReport, BrandContext } from "@/server/ai/types";

export function evaluateOutputQuality(output: unknown, brand: BrandContext): AIQualityReport {
  const text = JSON.stringify(output).toLowerCase();
  const warnings: string[] = [];
  const forbiddenHits = brand.forbiddenWords.filter((word) => text.includes(word.toLowerCase()));
  const repetitionScore = calculateRepetitionScore(text);

  if (forbiddenHits.length) warnings.push(`Forbidden words detected: ${forbiddenHits.join(", ")}`);
  if (repetitionScore > 0.22) warnings.push("Output appears repetitive.");
  if (brand.name && !text.includes(brand.name.toLowerCase().split(" ")[0])) {
    warnings.push("Output may be weakly connected to the brand context.");
  }

  return {
    brandingConsistent: forbiddenHits.length === 0,
    repetitionScore,
    warnings,
  };
}

export function assertPromptIsValid(prompt: string) {
  if (prompt.trim().length < 8) {
    throw new Error("Prompt is too short to generate reliable output.");
  }

  if (/(.)\1{20,}/.test(prompt)) {
    throw new Error("Prompt contains repetitive invalid content.");
  }
}

function calculateRepetitionScore(text: string): number {
  const words = text.split(/\W+/).filter((word) => word.length > 3);
  if (!words.length) return 0;

  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);

  const repeated = [...counts.values()].filter((count) => count > 2).reduce((sum, count) => sum + count, 0);
  return repeated / words.length;
}
