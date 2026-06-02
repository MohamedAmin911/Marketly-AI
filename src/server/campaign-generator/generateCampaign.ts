import { Types } from "mongoose";

import { CAMPAIGN_TEXT_MODEL, generateOpenRouterJson } from "@/server/ai/openrouter";
import { updateAIMemory } from "@/server/ai/memory/update-service";
import { CampaignModel, connectToDatabase } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import { buildSocialCampaignMessages } from "@/server/campaign-generator/prompts";
import { socialCampaignOutputSchema, type SocialCampaignGenerationInput } from "@/server/campaign-generator/validators";
import { uploadFileToImageKit } from "@/server/services/imagekit-service";
import { validateUploadFile } from "@/server/security/uploads";

export async function generateAndPersistCampaign(input: SocialCampaignGenerationInput, userId: string) {
  const objectId = toObjectId(userId);
  if (!objectId) throw apiErrors.unauthorized("A valid user session is required to generate campaigns.");

  await validateUploadFile(input.productImage);
  await assertImageReadable(input.productImage);

  const [productAsset, textResult] = await Promise.all([
    uploadFileToImageKit({
      alt: "Social campaign product reference",
      file: input.productImage,
      fileName: `social-campaign-ref-${crypto.randomUUID()}-${input.productImage.name}`,
      folder: "/marketly-ai/campaign-products",
    }),
    generateOpenRouterJson({
      messages: buildSocialCampaignMessages({
        customIdeas: input.customIdeas,
        mode: input.mode,
        moodPreset: input.moodPreset,
        theme: input.theme,
      }),
      schema: socialCampaignOutputSchema,
    }),
  ]);

  await connectToDatabase();
  const posts = textResult.data.posts.map((post) => ({
    ...post,
    id: crypto.randomUUID(),
  }));
  const title = input.mode === "custom" ? "Custom Social Campaign Ideas" : "Auto Social Campaign Scenarios";

  const campaign = await CampaignModel.create({
    brief: input.theme,
    campaignCards: posts.map((post) => ({
      caption: post.caption,
      creativePrompt: post.visualDirection,
      cta: "Save concept",
      hook: post.title,
      id: post.id,
      platform: post.platform,
      tone: input.moodPreset,
    })),
    campaignSummary: `Six ${input.mode === "custom" ? "custom" : "auto-generated"} social media post concepts in the ${input.moodPreset} direction.`,
    campaignTitle: title,
    captions: posts.map((post) => post.caption),
    ctaSuggestions: [],
    generationStatus: "completed",
    generatedImages: [],
    goal: "social-post-ideas",
    hooks: posts.map((post) => post.title),
    modelUsed: CAMPAIGN_TEXT_MODEL,
    name: title,
    platforms: [...new Set(posts.map((post) => post.platform))],
    platformStrategy: posts.map((post) => `${post.platform}: ${post.visualDirection}`),
    productImage: toAssetRef(productAsset),
    productTitle: "Uploaded product reference",
    socialCustomIdeas: input.customIdeas,
    socialMode: input.mode,
    socialMoodPreset: input.moodPreset,
    socialPosts: posts,
    socialTheme: input.theme,
    status: "completed",
    style: input.moodPreset,
    targetAudience: "social media audience",
    userId: objectId,
  });

  await updateAIMemory({
    averageGenerationType: "campaign",
    mostUsedFeatures: ["social-media-campaign-studio"],
    preferredCaptions: posts.map((post) => post.caption),
    preferredHooks: posts.map((post) => post.title),
    preferredStyles: [input.moodPreset, input.theme],
    successfulCampaigns: [title],
    successfulPrompts: [input.theme, ...input.customIdeas],
    userId,
    userPatterns: {
      lastSocialCampaignMode: input.mode,
      lastSocialCampaignMood: input.moodPreset,
      lastSocialCampaignAt: new Date().toISOString(),
    },
  }).catch(() => undefined);

  return serializeCampaign(campaign);
}

export async function listCampaignsForUser(userId: string) {
  const objectId = toObjectId(userId);
  if (!objectId) return { items: [] };
  await connectToDatabase();
  const campaigns = await CampaignModel.find({ userId: objectId }).sort({ createdAt: -1 }).limit(100).lean();
  return { items: campaigns.map(serializeCampaign) };
}

export async function getCampaignForUser(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) throw apiErrors.notFound("Campaign was not found.");
  const objectId = toObjectId(userId);
  if (!objectId) throw apiErrors.unauthorized();
  await connectToDatabase();
  const campaign = await CampaignModel.findOne({ _id: new Types.ObjectId(id), userId: objectId }).lean();
  if (!campaign) throw apiErrors.notFound("Campaign was not found.");
  return serializeCampaign(campaign);
}

export async function deleteCampaignForUser(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) throw apiErrors.notFound("Campaign was not found.");
  const objectId = toObjectId(userId);
  if (!objectId) throw apiErrors.unauthorized();
  await connectToDatabase();
  const campaign = await CampaignModel.findOne({ _id: new Types.ObjectId(id), userId: objectId });
  if (!campaign) throw apiErrors.notFound("Campaign was not found.");
  await (campaign as unknown as { softDelete: (deletedBy?: unknown) => Promise<unknown> }).softDelete(objectId);
  return { deleted: true, id };
}

export async function regenerateCampaignCreative() {
  throw apiErrors.badRequest("Image generation is not available in Social Media Campaign Studio.");
}

function serializeCampaign(value: unknown) {
  const campaign = isRecord(value) ? value : {};
  const posts = normalizePosts(campaign.socialPosts, campaign.campaignCards);

  return {
    createdAt: toIso(campaign.createdAt),
    customIdeas: Array.isArray(campaign.socialCustomIdeas) ? campaign.socialCustomIdeas.filter((item): item is string => typeof item === "string") : [],
    generationStatus: stringValue(campaign.generationStatus, "completed"),
    id: String(campaign._id),
    mode: campaign.socialMode === "custom" ? "custom" : "auto",
    modelUsed: stringValue(campaign.modelUsed, CAMPAIGN_TEXT_MODEL),
    moodPreset: stringValue(campaign.socialMoodPreset, "Original"),
    posts,
    productImage: isRecord(campaign.productImage) ? campaign.productImage : undefined,
    theme: stringValue(campaign.socialTheme ?? campaign.brief),
    title: stringValue(campaign.campaignTitle ?? campaign.name, "Social Campaign"),
    updatedAt: toIso(campaign.updatedAt),
  };
}

function normalizePosts(primary: unknown, fallback: unknown) {
  if (Array.isArray(primary)) {
    return primary.map((post) => {
      const record = isRecord(post) ? post : {};
      return {
        caption: stringValue(record.caption),
        id: stringValue(record.id, crypto.randomUUID()),
        platform: stringValue(record.platform),
        title: stringValue(record.title),
        visualDirection: stringValue(record.visualDirection),
      };
    });
  }

  if (!Array.isArray(fallback)) return [];
  return fallback.map((card) => {
    const record = isRecord(card) ? card : {};
    return {
      caption: stringValue(record.caption),
      id: stringValue(record.id, crypto.randomUUID()),
      platform: stringValue(record.platform),
      title: stringValue(record.hook),
      visualDirection: stringValue(record.creativePrompt),
    };
  });
}

function toAssetRef(asset: Record<string, unknown>) {
  return {
    alt: asset.alt,
    fileId: asset.fileId,
    height: asset.height,
    metadata: asset.metadata,
    mimeType: asset.mimeType,
    storageKey: asset.storageKey,
    thumbnailUrl: asset.thumbnailUrl,
    url: asset.url,
    width: asset.width,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

function toObjectId(value: string) {
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  if (process.env.NODE_ENV !== "production") return new Types.ObjectId("000000000000000000000001");
  return null;
}

async function assertImageReadable(file: File) {
  const header = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  if (!header.some(Boolean)) throw apiErrors.badRequest("Image appears corrupted.");
}
