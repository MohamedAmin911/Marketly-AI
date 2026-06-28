import { Types } from "mongoose";
import { z } from "zod";
import { getAIProvider } from "@/lib/services/ai-factory";
import { updateAIMemory } from "@/server/ai/memory/update-service";
import { CampaignModel, connectToDatabase } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import { buildSocialCampaignMessages } from "@/server/campaign-generator/prompts";
import { socialCampaignOutputSchema, type SocialCampaignGenerationInput } from "@/server/campaign-generator/validators";
import { uploadFileToImageKit } from "@/server/services/imagekit-service";
import { validateUploadFile } from "@/server/security/uploads";
import { CreditsService } from "@/server/services/billing/credits.service";

export async function generateAndPersistCampaign(input: SocialCampaignGenerationInput, userId: string) {
  const objectId = toObjectId(userId);
  if (!objectId) throw apiErrors.unauthorized("A valid user session is required to generate campaigns.");

  await validateUploadFile(input.productImage);
  await assertImageReadable(input.productImage);

  await connectToDatabase();
  await CreditsService.deductCredits(userId, 2, "campaign_generator", "Generated social campaign");

  const [productAsset, textResult] = await Promise.all([
    uploadFileToImageKit({
      alt: "Social campaign product reference",
      file: input.productImage,
      fileName: `social-campaign-ref-${crypto.randomUUID()}-${input.productImage.name}`,
      folder: "/marketly-ai/campaign-products",
    }),
    generateOpenAIJson({
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
    modelUsed: textResult.modelUsed,
    name: title,
    platforms: Array.from(new Set(posts.map((post) => post.platform))),
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

async function generateOpenAIJson<TSchema extends z.ZodType>(
  options: {
    messages: Array<{ content: string; role: "system" | "user" | "assistant" }>;
    schema: TSchema;
    maxTokens?: number;
    model?: string;
    temperature?: number;
  },
): Promise<{ data: z.infer<TSchema>; modelUsed: string; rawContent: string }> {
  const model = options.model ?? "gpt-4o-mini";
  const response = await getAIProvider().generateChatCompletion({
    model,
    messages: options.messages,
    maxTokens: options.maxTokens ?? 3500,
    temperature: options.temperature ?? 0.72,
    responseFormat: "text",
  });

  const rawContent = response.content;
  if (!rawContent.trim()) {
    throw new Error("OpenAI returned an empty campaign response.");
  }

  const parsed = parseStrictJson(rawContent);
  const result = options.schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    throw new Error(`OpenAI returned malformed campaign JSON: ${issues}`);
  }

  return {
    data: result.data,
    modelUsed: model,
    rawContent,
  };
}

function parseStrictJson(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI response did not contain valid JSON.");
    return JSON.parse(match[0]);
  }
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
    modelUsed: stringValue(campaign.modelUsed, "gpt-4o-mini"),
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
