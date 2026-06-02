import { z } from "zod";

const assetSchema = z.object({
  alt: z.string().max(240).optional(),
  fileId: z.string().max(240).optional(),
  height: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  mimeType: z.string().max(120).optional(),
  name: z.string().max(240).optional(),
  provider: z.string().max(120).optional(),
  size: z.number().nonnegative().optional(),
  storageKey: z.string().max(512).optional(),
  thumbnailUrl: z.string().max(2048).optional(),
  url: z.string().max(2048).optional(),
  width: z.number().nonnegative().optional(),
});

export const socialCampaignOutputSchema = z.preprocess(normalizeSocialOutput, z.object({
  posts: z.array(z.object({
    caption: textSchema(8, 2200),
    platform: textSchema(2, 80),
    title: textSchema(3, 180),
    visualDirection: textSchema(12, 2200),
  })).length(6),
}));

export const socialCampaignGenerationSchema = z.object({
  customIdeas: z.array(z.string().trim().max(500)).max(6).default([]),
  mode: z.enum(["auto", "custom"]),
  moodPreset: z.string().trim().min(2).max(80).default("Original"),
  productImage: z.instanceof(File),
  theme: z.string().trim().min(2).max(2000),
});

export const campaignRegenerateSchema = z.object({
  mode: z.enum(["campaign", "card", "creative"]),
});

export const persistedCampaignCardSchema = z.object({
  caption: z.string(),
  generatedImage: assetSchema.optional(),
  hook: z.string(),
  id: z.string(),
  platform: z.string(),
  title: z.string().optional(),
  visualDirection: z.string().optional(),
});

export type SocialCampaignGenerationInput = z.infer<typeof socialCampaignGenerationSchema>;
export type SocialCampaignOutput = z.infer<typeof socialCampaignOutputSchema>;

function textSchema(min: number, max: number) {
  return z.preprocess(textFromUnknown, z.string().trim().min(min).max(max));
}

function normalizeSocialOutput(value: unknown) {
  if (!isRecord(value)) return value;
  return {
    posts: normalizePosts(value.posts ?? value.campaignPosts ?? value.campaign_posts ?? value.ideas ?? value.cards),
  };
}

function normalizePosts(value: unknown) {
  const posts = Array.isArray(value) ? value : isRecord(value) ? Object.values(value) : [];
  return posts.slice(0, 6).map((item) => {
    const post = isRecord(item) ? item : {};
    return {
      caption: post.caption ?? post.socialCaption ?? post.social_caption ?? post.copy,
      platform: post.platform ?? post.suggestedPlatform ?? post.suggested_platform ?? post.channel,
      title: post.title ?? post.postTitle ?? post.post_title ?? post.concept,
      visualDirection: post.visualDirection ?? post.visual_direction ?? post.imagePrompt ?? post.visual ?? post.direction,
    };
  });
}

function textFromUnknown(value: unknown) {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!isRecord(value)) return "";

  const direct = ["text", "value", "description", "summary", "caption", "title", "visualDirection", "platform"]
    .map((key) => value[key])
    .find((item) => typeof item === "string" && item.trim());
  if (typeof direct === "string") return direct.replace(/\s+/g, " ").trim();

  return Object.entries(value)
    .filter(([, item]) => typeof item === "string" || typeof item === "number" || typeof item === "boolean")
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join("; ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
