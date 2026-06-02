import { Types } from "mongoose";

import { CampaignModel, connectToDatabase } from "@/server/database";

export type PersonalizationContext = {
  favoriteStyle: string;
  preferredPlatforms: string[];
  preferredTone: string;
  previousCampaignCount: number;
  previousHooks: string[];
  recentBriefs: string[];
};

export async function buildCampaignPersonalization(userId: string): Promise<PersonalizationContext> {
  const objectId = toObjectId(userId);
  if (!objectId) return emptyPersonalization();

  await connectToDatabase();
  const campaigns = await CampaignModel.find({ userId: objectId }).sort({ createdAt: -1 }).limit(12).lean();
  const platformCounts = countValues(campaigns.flatMap((campaign) => campaign.platforms ?? []));
  const styleCounts = countValues(campaigns.map((campaign) => String(campaign.style ?? "")).filter(Boolean));
  const tones = campaigns.flatMap((campaign) => Array.isArray(campaign.campaignCards) ? campaign.campaignCards.map((card) => String(card.tone ?? "")) : []).filter(Boolean);

  return {
    favoriteStyle: topValue(styleCounts) ?? "adaptive premium",
    preferredPlatforms: Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([platform]) => platform),
    preferredTone: topValue(countValues(tones)) ?? "confident, modern, conversion-focused",
    previousCampaignCount: campaigns.length,
    previousHooks: campaigns.flatMap((campaign) => Array.isArray(campaign.campaignCards) ? campaign.campaignCards.map((card) => String(card.hook ?? "")) : []).filter(Boolean).slice(0, 8),
    recentBriefs: campaigns.map((campaign) => String(campaign.brief ?? campaign.description ?? "")).filter(Boolean).slice(0, 6),
  };
}

function emptyPersonalization(): PersonalizationContext {
  return {
    favoriteStyle: "adaptive premium",
    preferredPlatforms: [],
    preferredTone: "confident, modern, conversion-focused",
    previousCampaignCount: 0,
    previousHooks: [],
    recentBriefs: [],
  };
}

function countValues(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    const key = value.trim();
    if (!key) return counts;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function topValue(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function toObjectId(value: string) {
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  if (process.env.NODE_ENV !== "production") return new Types.ObjectId("000000000000000000000001");
  return null;
}
