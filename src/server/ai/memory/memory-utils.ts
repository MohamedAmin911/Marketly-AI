import type { AIMemoryRecord, BrandIdentityMemory, CreativeMemory } from "@/server/ai/memory/types";

const maxItems = {
  captions: 20,
  campaigns: 24,
  conversations: 12,
  creatives: 24,
  hooks: 24,
  prompts: 24,
  recommendations: 24,
  strategies: 12,
  styles: 16,
};

const defaultBrandIdentity: BrandIdentityMemory = {
  forbiddenWords: [],
  values: [],
};

export function createEmptyMemory(userId: string, brandId?: string): AIMemoryRecord {
  return {
    brandId,
    brandIdentity: defaultBrandIdentity,
    conflicts: [],
    freshness: "missing",
    isMissing: true,
    mostUsedFeatures: [],
    preferredCaptions: [],
    preferredHooks: [],
    preferredStyles: [],
    previousConversations: [],
    previousRecommendations: [],
    previousStrategies: [],
    successfulCampaigns: [],
    successfulCreatives: [],
    successfulPrompts: [],
    userId,
    userPatterns: {},
    warnings: ["No memory profile exists yet. Use neutral brand-safe defaults until preferences are learned."],
  };
}

export function normalizeMemory(memory: AIMemoryRecord): AIMemoryRecord {
  const conflicts = detectPreferenceConflicts(memory.preferredStyles);
  const freshness = resolveFreshness(memory.lastUpdatedAt, memory.isMissing);

  return {
    ...memory,
    brandIdentity: {
      ...defaultBrandIdentity,
      ...memory.brandIdentity,
      forbiddenWords: uniqueStrings(memory.brandIdentity.forbiddenWords).slice(0, 20),
      values: uniqueStrings(memory.brandIdentity.values).slice(0, 12),
    },
    conflicts,
    freshness,
    mostUsedFeatures: uniqueStrings(memory.mostUsedFeatures).slice(0, maxItems.styles),
    preferredCaptions: uniqueStrings(memory.preferredCaptions).slice(0, maxItems.captions),
    preferredHooks: uniqueStrings(memory.preferredHooks).slice(0, maxItems.hooks),
    preferredStyles: uniqueStrings(memory.preferredStyles).slice(0, maxItems.styles),
    previousRecommendations: uniqueStrings(memory.previousRecommendations).slice(0, maxItems.recommendations),
    previousStrategies: uniqueStrings(memory.previousStrategies).slice(0, maxItems.strategies),
    successfulCampaigns: uniqueStrings(memory.successfulCampaigns).slice(0, maxItems.campaigns),
    successfulCreatives: uniqueCreatives(memory.successfulCreatives).slice(0, maxItems.creatives),
    successfulPrompts: uniqueStrings(memory.successfulPrompts).slice(0, maxItems.prompts),
    warnings: [
      ...memory.warnings,
      ...(freshness === "outdated" ? ["Memory is older than 90 days. Treat preferences as weak signals."] : []),
      ...conflicts.map((conflict) => `Conflicting preference detected: ${conflict}`),
    ],
  };
}

export function mergeStringLists(existing: string[], incoming?: string[], limit = 24): string[] {
  return uniqueStrings([...(incoming ?? []), ...existing]).slice(0, limit);
}

export function mergeCreatives(existing: CreativeMemory[], incoming?: CreativeMemory[], limit = 24): CreativeMemory[] {
  return uniqueCreatives([...(incoming ?? []), ...existing]).slice(0, limit);
}

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function uniqueCreatives(values: CreativeMemory[]): CreativeMemory[] {
  const seen = new Set<string>();

  return values
    .filter((creative) => creative.title?.trim())
    .map((creative) => ({ ...creative, title: creative.title.trim() }))
    .filter((creative) => {
      const key = (creative.id ?? creative.url ?? creative.title).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function resolveFreshness(lastUpdatedAt?: string, isMissing = false): AIMemoryRecord["freshness"] {
  if (isMissing || !lastUpdatedAt) return "missing";

  const ageMs = Date.now() - new Date(lastUpdatedAt).getTime();
  return ageMs > 90 * 24 * 60 * 60 * 1000 ? "outdated" : "fresh";
}

function detectPreferenceConflicts(styles: string[]): string[] {
  const normalized = styles.map((style) => style.toLowerCase());
  const conflicts: string[] = [];

  if (normalized.some((style) => style.includes("minimal")) && normalized.some((style) => style.includes("maximal"))) {
    conflicts.push("minimalist and maximalist styles are both preferred");
  }

  if (normalized.some((style) => style.includes("luxury")) && normalized.some((style) => style.includes("budget"))) {
    conflicts.push("luxury and budget positioning are both preferred");
  }

  if (normalized.some((style) => style.includes("playful")) && normalized.some((style) => style.includes("formal"))) {
    conflicts.push("playful and formal voice cues are both preferred");
  }

  return conflicts;
}
