import type { AIMemoryRecord } from "@/server/ai/memory/types";

type AnalyticsCompleteness = {
  conversions?: number;
  ctr?: number;
  impressions?: number;
  roi?: number;
};

export function createMemoryInjection(memory: AIMemoryRecord, analytics?: AnalyticsCompleteness): {
  lines: string[];
  text: string;
  warnings: string[];
} {
  const warnings = [
    ...memory.warnings,
    ...(analytics && isIncompleteAnalytics(analytics) ? ["Analytics context is incomplete. Do not infer missing performance metrics."] : []),
  ];
  const lines = [
    "Use AI memory as personalization guidance, not as factual proof.",
    memory.brandIdentity.name ? `Brand name: ${memory.brandIdentity.name}` : undefined,
    memory.brandIdentity.positioning ? `Brand positioning: ${memory.brandIdentity.positioning}` : undefined,
    memory.brandIdentity.tone ? `Brand tone: ${memory.brandIdentity.tone}` : undefined,
    memory.brandIdentity.voice ? `Brand voice: ${memory.brandIdentity.voice}` : undefined,
    memory.brandIdentity.visualStyle ? `Visual style: ${memory.brandIdentity.visualStyle}` : undefined,
    memory.preferredStyles.length ? `Preferred styles: ${memory.preferredStyles.join(", ")}` : undefined,
    memory.preferredHooks.length ? `Preferred hooks: ${memory.preferredHooks.slice(0, 4).join(" | ")}` : undefined,
    memory.preferredCaptions.length ? `Preferred captions: ${memory.preferredCaptions.slice(0, 3).join(" | ")}` : undefined,
    memory.successfulCampaigns.length ? `Successful campaigns: ${memory.successfulCampaigns.slice(0, 5).join(", ")}` : undefined,
    memory.successfulPrompts.length ? `Successful prompts: ${memory.successfulPrompts.slice(0, 4).join(" | ")}` : undefined,
    memory.successfulCreatives.length ? `Successful creatives: ${memory.successfulCreatives.map((creative) => creative.title).slice(0, 5).join(", ")}` : undefined,
    memory.previousRecommendations.length ? `Avoid repeating these recommendations verbatim: ${memory.previousRecommendations.slice(0, 5).join(" | ")}` : undefined,
    Object.keys(memory.userPatterns).length ? `User behavior patterns: ${Object.entries(memory.userPatterns).map(([key, value]) => `${key}=${String(value)}`).slice(0, 6).join(", ")}` : undefined,
    warnings.length ? `Memory guardrails: ${warnings.join(" | ")}` : undefined,
  ].filter((line): line is string => Boolean(line));

  return {
    lines,
    text: lines.join("\n"),
    warnings,
  };
}

function isIncompleteAnalytics(analytics: AnalyticsCompleteness) {
  return analytics.impressions === undefined || analytics.ctr === undefined || analytics.conversions === undefined || analytics.roi === undefined;
}
