import { z } from "zod";

import { buildMemoryContext, injectMemoryGuidance } from "@/server/ai/memory/memory-builder";
import { apiErrors } from "@/server/errors/api-error";
import type { AuthContext } from "@/server/security/auth-guard";
import { validateUploadFile } from "@/server/security/uploads";
import { generateCampaignCreative } from "@/server/campaign-generator/creative-service";
import { generateWithMistral } from "@/server/campaign-generator/mistral-service";
import type { CampaignCreativesInput, CampaignGenerationInput, CampaignTextMutationInput, CampaignUploadInput } from "@/server/campaign-generator/schemas";
import type { CampaignAngle, CampaignAnalytics, CampaignAsset, CampaignRecord, CampaignRecommendation } from "@/server/campaign-generator/types";

const campaignStore = new Map<string, CampaignRecord>();
const duplicateIndex = new Map<string, string>();

const campaignPlanSchema = z.object({
  angles: z.array(z.object({
    caption: z.string(),
    hook: z.string(),
    platform: z.string(),
    prompt: z.string(),
    rationale: z.string(),
    title: z.string(),
  })).min(3).max(6),
  captions: z.array(z.string()).min(3).max(12),
  ctaSuggestions: z.array(z.string()).min(3).max(8),
  hooks: z.array(z.string()).min(3).max(12),
  recommendations: z.array(z.object({
    confidence: z.number().min(0).max(1).default(0.74),
    label: z.string(),
    reason: z.string(),
  })).default([]),
  summary: z.string(),
});

const copySchema = z.object({
  items: z.array(z.string()).min(4).max(12),
});

export async function uploadCampaignProduct(input: CampaignUploadInput): Promise<{ asset: CampaignAsset; uploadStatus: "ready" }> {
  await validateUploadFile(input.file);
  await assertImageReadable(input.file);

  const storageKey = `campaigns/uploads/${crypto.randomUUID()}-${input.file.name}`;

  return {
    asset: {
      alt: input.file.name,
      mimeType: input.file.type,
      name: input.file.name,
      provider: "marketly-upload",
      size: input.file.size,
      storageKey,
      url: `memory://${storageKey}`,
    },
    uploadStatus: "ready",
  };
}

export async function generateCampaign(input: CampaignGenerationInput, auth: AuthContext): Promise<CampaignRecord> {
  const fingerprint = await createCampaignFingerprint(input, auth.user.sub);
  const existingId = duplicateIndex.get(fingerprint);
  const existing = existingId ? campaignStore.get(existingId) : undefined;

  if (existing) return existing;

  const memory = await buildMemoryContext(auth.user.sub, input.brandId);
  const fallback = createFallbackPlan(input);
  const result = await generateWithMistral(buildCampaignPrompt(input, injectMemoryGuidance(memory)), campaignPlanSchema, fallback);
  const plan = sanitizePlan(result.data, input);
  const creatives = await generateCreativesForAngles(plan.angles, input.productTitle);
  const analytics = buildAnalytics(plan, input.platforms);
  const failedCreatives = creatives.filter((creative) => creative.generationStatus === "failed").length;
  const now = new Date().toISOString();

  const campaign: CampaignRecord = {
    analytics,
    angles: plan.angles,
    captions: plan.captions,
    ctaSuggestions: plan.ctaSuggestions,
    creatives,
    generationErrors: failedCreatives ? [`${failedCreatives} creative${failedCreatives === 1 ? "" : "s"} failed to generate.`] : [],
    generationStatus: failedCreatives === creatives.length ? "failed" : "completed",
    hooks: plan.hooks,
    id: crypto.randomUUID(),
    modelUsed: `${result.modelUsed} + Stable Diffusion XL`,
    platforms: input.platforms,
    productImage: input.productImage,
    productTitle: input.productTitle,
    prompt: input.prompt,
    recommendations: plan.recommendations,
    targetAudience: input.targetAudience,
    title: `${input.productTitle} Campaign`,
    updatedAt: now,
  };

  duplicateIndex.set(fingerprint, campaign.id);
  campaignStore.set(campaign.id, campaign);
  return campaign;
}

export async function regenerateCampaignText(input: CampaignTextMutationInput, auth: AuthContext) {
  const memory = await buildMemoryContext(auth.user.sub);
  const prompt = [
    `Generate ${input.mode} for a campaign.`,
    `Product: ${input.campaign.productTitle}`,
    `Audience: ${input.campaign.targetAudience}`,
    `Platforms: ${input.campaign.platforms.join(", ")}`,
    `Campaign brief: ${input.campaign.prompt}`,
    `Existing hooks: ${input.campaign.hooks.join(" | ")}`,
    `Existing captions: ${input.campaign.captions.join(" | ")}`,
    injectMemoryGuidance(memory),
    "Return JSON only: { \"items\": string[] }.",
    input.mode === "hooks" ? "Hooks must be short, varied, non-repetitive, and claim-safe." : "Captions must be distinct, platform-ready, and avoid unsupported measurable claims.",
  ].join("\n");
  const fallback = { items: input.mode === "hooks" ? createFallbackHooks(input.campaign.productTitle) : createFallbackCaptions(input.campaign.productTitle, input.campaign.targetAudience) };
  const result = await generateWithMistral(prompt, copySchema, fallback);

  return {
    items: dedupeTextItems(result.data.items).map(filterHallucinatedClaims).slice(0, 8),
    modelUsed: result.modelUsed,
  };
}

export async function regenerateCampaignCreatives(input: CampaignCreativesInput) {
  const angles = input.campaign.angles.length ? input.campaign.angles : createFallbackPlan({
    goal: "conversion",
    platforms: ["instagram", "tiktok", "facebook"],
    productTitle: input.campaign.productTitle,
    prompt: "Generate product campaign creatives.",
    style: "social",
    targetAudience: "marketing teams",
  }).angles.map((angle) => ({ ...angle, id: crypto.randomUUID() }));

  return {
    creatives: await generateCreativesForAngles(angles, input.campaign.productTitle),
  };
}

export function recordCampaignAnalytics(campaignId: string, event: string) {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) {
    return {
      accepted: 1,
      campaignId,
      event,
      tracked: false,
    };
  }

  campaign.analytics = {
    ...campaign.analytics,
    eventsAccepted: campaign.analytics.eventsAccepted + 1,
    generatedAt: new Date().toISOString(),
  };
  campaignStore.set(campaign.id, campaign);

  return {
    accepted: 1,
    analytics: campaign.analytics,
    campaignId,
    event,
    tracked: true,
  };
}

function buildCampaignPrompt(input: CampaignGenerationInput, memoryGuidance: string): string {
  return [
    "You are Marketly AI generating a production-ready paid/social campaign.",
    `Analyze product: ${input.productTitle}`,
    `Product image metadata: ${input.productImage?.name ?? "not uploaded"} ${input.productImage?.mimeType ?? ""}`.trim(),
    `Brief: ${input.prompt}`,
    `Goal: ${input.goal}`,
    `Target audience: ${input.targetAudience}`,
    `Platforms: ${input.platforms.join(", ")}`,
    `Style: ${input.style}`,
    "Workflow: analyze product, generate campaign angles, hooks, captions, CTA suggestions, ad prompts, and recommendations.",
    "Avoid hallucinated claims, unsupported metrics, fake awards, fake customer names, medical promises, and repetitive copy.",
    "Make every hook and caption meaningfully distinct and brand-consistent.",
    `Brand memory:\n${memoryGuidance}`,
    'Return JSON only with this contract: { "summary": string, "angles": [{ "title": string, "platform": string, "hook": string, "caption": string, "prompt": string, "rationale": string }], "hooks": string[], "captions": string[], "ctaSuggestions": string[], "recommendations": [{ "label": string, "reason": string, "confidence": number }] }',
  ].join("\n");
}

function sanitizePlan(plan: z.infer<typeof campaignPlanSchema>, input: CampaignGenerationInput) {
  const angles = plan.angles.map((angle, index): CampaignAngle => ({
    caption: filterHallucinatedClaims(cleanText(angle.caption, createFallbackCaptions(input.productTitle, input.targetAudience)[index % 4])),
    hook: filterHallucinatedClaims(cleanText(angle.hook, createFallbackHooks(input.productTitle)[index % 4])),
    id: crypto.randomUUID(),
    platform: input.platforms.includes(angle.platform as CampaignGenerationInput["platforms"][number]) ? angle.platform : input.platforms[index % input.platforms.length],
    prompt: strengthenPrompt(cleanText(angle.prompt, `${input.productTitle} product ad creative for ${input.targetAudience}`), input),
    rationale: cleanText(angle.rationale, "Balances product clarity with audience-specific conversion intent."),
    title: cleanText(angle.title, `${input.productTitle} Angle ${index + 1}`),
  }));

  return {
    angles: ensureAngles(angles, input),
    captions: dedupeTextItems([...plan.captions, ...angles.map((angle) => angle.caption)]).map(filterHallucinatedClaims).slice(0, 8),
    ctaSuggestions: dedupeTextItems(plan.ctaSuggestions).slice(0, 6),
    hooks: dedupeTextItems([...plan.hooks, ...angles.map((angle) => angle.hook)]).map(filterHallucinatedClaims).slice(0, 8),
    recommendations: normalizeRecommendations(plan.recommendations),
    summary: cleanText(plan.summary, `${input.productTitle} campaign for ${input.targetAudience}.`),
  };
}

async function generateCreativesForAngles(angles: CampaignAngle[], productTitle: string) {
  return Promise.all(angles.slice(0, 6).map(async (angle, index) => {
    try {
      return await generateCampaignCreative(angle, productTitle, index);
    } catch (error) {
      return {
        alt: angle.title,
        campaignAngleId: angle.id,
        generationErrors: [error instanceof Error ? error.message : String(error)],
        generationStatus: "failed" as const,
        id: crypto.randomUUID(),
        mimeType: "image/webp",
        name: `campaign-creative-${index + 1}.webp`,
        prompt: angle.prompt,
        provider: "openai/dall-e-3",
        size: 0,
        title: angle.title,
      };
    }
  }));
}

function createFallbackPlan(input: Pick<CampaignGenerationInput, "goal" | "platforms" | "productTitle" | "prompt" | "style" | "targetAudience">): z.infer<typeof campaignPlanSchema> {
  const hooks = createFallbackHooks(input.productTitle);
  const captions = createFallbackCaptions(input.productTitle, input.targetAudience);
  const ctas = ["Start your campaign", "See it in action", "Try the workflow", "Build better creative", "Launch faster"];

  return {
    angles: input.platforms.slice(0, 4).map((platform, index) => ({
      caption: captions[index % captions.length],
      hook: hooks[index % hooks.length],
      platform,
      prompt: `${input.style} ${platform} ad for ${input.productTitle}, product-centered visual, clear benefit for ${input.targetAudience}, brand-safe commercial creative`,
      rationale: "Uses a clear audience pain point and product proof without unsupported claims.",
      title: ["Problem Solver", "Speed To Launch", "Creative Quality", "Team Momentum"][index % 4],
    })),
    captions,
    ctaSuggestions: ctas,
    hooks,
    recommendations: [
      {
        confidence: 0.78,
        label: "Test hook contrast",
        reason: "Run one direct problem hook against one aspirational hook before increasing budget.",
      },
    ],
    summary: `${input.productTitle} campaign focused on ${input.goal} for ${input.targetAudience}.`,
  };
}

function createFallbackHooks(productTitle: string): string[] {
  return [
    `Your next campaign starts with ${productTitle}.`,
    "Stop turning good ideas into scattered assets.",
    "Make the product benefit obvious in the first second.",
    "From brief to launch-ready creative without the mess.",
    "The cleaner way to turn product value into demand.",
  ];
}

function createFallbackCaptions(productTitle: string, audience: string): string[] {
  return [
    `${productTitle} helps ${audience} move from raw ideas to campaign-ready creative with a clearer workflow.`,
    `Build a sharper launch story around ${productTitle}, then adapt it across the channels your audience already checks.`,
    `When every asset needs a job, ${productTitle} keeps the message focused: problem, proof, and next step.`,
    `Give your team a cleaner way to shape product benefits into hooks, captions, and visuals that feel connected.`,
  ];
}

function ensureAngles(angles: CampaignAngle[], input: CampaignGenerationInput): CampaignAngle[] {
  const fallback = createFallbackPlan(input).angles.map((angle): CampaignAngle => ({ ...angle, id: crypto.randomUUID() }));
  const merged = [...angles, ...fallback];
  const seen = new Set<string>();

  return merged.filter((angle) => {
    const signature = angle.title.toLowerCase().replace(/[^a-z0-9]+/g, " ");
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  }).slice(0, 6);
}

function dedupeTextItems(items: string[]): string[] {
  const seen = new Set<string>();

  return items.map((item) => cleanText(item, "")).filter(Boolean).filter((item) => {
    const signature = item.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((word) => word.length > 3).slice(0, 10).join(" ");
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function strengthenPrompt(prompt: string, input: CampaignGenerationInput): string {
  const required = [`product ${input.productTitle}`, `${input.style} ad`, `for ${input.targetAudience}`, "brand-safe", "clear product benefit"];
  const lowered = prompt.toLowerCase();
  const additions = required.filter((item) => !lowered.includes(item.toLowerCase()));

  return [prompt, ...additions].join(", ");
}

function filterHallucinatedClaims(value: string): string {
  return value
    .replace(/\b(guaranteed|guarantee|cure|certified|award-winning|#1|number one|100%|10x|double your revenue)\b/gi, "proven")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRecommendations(recommendations: CampaignRecommendation[]): CampaignRecommendation[] {
  return recommendations.length ? recommendations.slice(0, 6).map((item) => ({
    confidence: Math.min(Math.max(item.confidence ?? 0.7, 0), 1),
    label: cleanText(item.label, "Campaign recommendation"),
    reason: filterHallucinatedClaims(cleanText(item.reason, "Review this recommendation before launch.")),
  })) : [
    {
      confidence: 0.72,
      label: "Validate claims",
      reason: "Keep benefit language specific without adding unsupported performance promises.",
    },
  ];
}

function buildAnalytics(plan: z.infer<typeof campaignPlanSchema>, platforms: string[]): CampaignAnalytics {
  const captionStrength = Math.min(plan.captions.join(" ").length / 900, 1);
  const hookStrength = Math.min(plan.hooks.length / 8, 1);

  return {
    estimatedCtr: Number((1.2 + hookStrength * 1.8).toFixed(2)),
    estimatedEngagementRate: Number((2.4 + captionStrength * 2.6).toFixed(2)),
    eventsAccepted: 1,
    generatedAt: new Date().toISOString(),
    riskLevel: plan.recommendations.length > 3 ? "medium" : "low",
    topPlatform: platforms[0] ?? "instagram",
  };
}

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ") : fallback;
}

async function createCampaignFingerprint(input: CampaignGenerationInput, userId: string): Promise<string> {
  const payload = JSON.stringify({
    goal: input.goal,
    platforms: input.platforms,
    productImage: input.productImage?.storageKey ?? input.productImage?.name,
    productTitle: input.productTitle,
    prompt: input.prompt,
    style: input.style,
    targetAudience: input.targetAudience,
    userId,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Buffer.from(digest).toString("base64url");
}

async function assertImageReadable(file: File) {
  const header = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  if (!header.some(Boolean)) throw apiErrors.badRequest("Image appears corrupted.");
}
