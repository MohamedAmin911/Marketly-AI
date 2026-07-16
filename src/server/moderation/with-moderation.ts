// @ts-ignore - bad-words types require synthetic default imports
import Filter from "bad-words";
import type { NextRequest } from "next/server";

import {
  AI_MODERATION_CONFIG,
  AI_POLICY_WARNING_MESSAGE,
  AI_SUSPENSION_MESSAGE,
  AI_TEMPORARY_BLOCK_MESSAGE,
} from "@/server/config/moderation";
import { connectToDatabase } from "@/server/database";
import { AIViolationModel } from "@/server/database/models/ai-violation.model";
import { UserModel } from "@/server/database/models/user.model";
import { ApiError, apiErrors } from "@/server/errors/api-error";
import type { AuthContext } from "@/server/security/auth-guard";

export type AIFeatureName =
  | "AI Assistant"
  | "Image Generation"
  | "Video Generation"
  | "Marketing Strategy"
  | "Campaign Generator"
  | "Creator Studio"
  | "Growth Engine"
  | "Viral Engine"
  | "Analytics Engine"
  | "Storyboard Generator"
  | "AI Personalization"
  | "Generic AI Generation";

type PromptInput = string | null | undefined;

type ModerationRequest = {
  auth: AuthContext;
  feature: AIFeatureName | string;
  prompts: PromptInput | PromptInput[];
};

type UnsafePromptResult = {
  category: string;
  reason: string;
};

type ModerationMemoryUser = {
  aiBlockedUntil?: Date | null;
  aiStrikes: number;
  email: string;
  fullName: string;
  id: string;
  lastViolationAt?: Date | null;
  lastViolationFeature?: string | null;
  lastViolationReason?: string | null;
  status: string;
};

type ModerationMemoryViolation = {
  userId: string;
  email: string;
  prompt: string;
  feature: string;
  category: string;
  reason: string;
  strikeNumber: number;
  timestamp: Date;
};

const filter = new Filter();
filter.addWords("nsfw", "gore");

const globalForModeration = globalThis as typeof globalThis & {
  marketlyModerationUsers?: Map<string, ModerationMemoryUser>;
  marketlyModerationViolations?: ModerationMemoryViolation[];
};

const memoryUsers = globalForModeration.marketlyModerationUsers ?? new Map<string, ModerationMemoryUser>();
const memoryViolations = globalForModeration.marketlyModerationViolations ?? [];
globalForModeration.marketlyModerationUsers = memoryUsers;
globalForModeration.marketlyModerationViolations = memoryViolations;

const unsafePatterns: Array<UnsafePromptResult & { pattern: RegExp }> = [
  {
    category: "sexual_content",
    pattern: /\b(porn|pornography|porno|xxx|nsfw|explicit|erotic|fetish|onlyfans|sexually|sexual|sex|nude|nudity|naked|topless|bottomless|strip|striptease|undress|lingerie|orgasm|masturbat(?:e|ion)|blowjob|handjob|anal|genitals?|penis|vagina|breasts?|boobs?|nipples?)\b/i,
    reason: "The prompt appears to request sexual, nude, pornographic, or explicit content.",
  },
  {
    category: "sexual_minors",
    pattern: /\b(minor|child|children|teen|teenager|underage|young girl|young boy)\b[\s\S]{0,80}\b(sex|sexual|nude|naked|explicit|porn|erotic|seductive)\b|\b(sex|sexual|nude|naked|explicit|porn|erotic|seductive)\b[\s\S]{0,80}\b(minor|child|children|teen|teenager|underage|young girl|young boy)\b/i,
    reason: "The prompt appears to combine sexual content with minors or underage people.",
  },
  {
    category: "graphic_violence",
    pattern: /\b(gore|dismember|decapitat(?:e|ion)|graphic blood|torture|mutilat(?:e|ion))\b/i,
    reason: "The prompt appears to request graphic violence or gore.",
  },
];

export async function moderateAIRequest({ auth, feature, prompts }: ModerationRequest) {
  const user = await getModerationUser(auth);
  assertUserCanUseAI(user);

  const promptList = (Array.isArray(prompts) ? prompts : [prompts])
    .filter((prompt): prompt is string => typeof prompt === "string")
    .map((prompt) => prompt.trim())
    .filter(Boolean);

  if (!promptList.length) {
    throw apiErrors.badRequest("A prompt is required before using AI generation.");
  }

  for (const prompt of promptList) {
    const unsafe = detectUnsafePrompt(prompt);
    if (unsafe) {
      await recordViolation({
        auth,
        category: unsafe.category,
        email: user.email,
        feature,
        prompt,
        reason: unsafe.reason,
      });
    }
  }
}

export async function assertAIAccountAccess(auth: AuthContext) {
  const user = await getModerationUser(auth);
  assertUserCanUseAI(user);
}

export async function withAIModeration<T>(
  request: NextRequest,
  auth: AuthContext,
  feature: AIFeatureName | string,
  prompts: PromptInput | PromptInput[],
  run: () => Promise<T>,
) {
  await moderateAIRequest({ auth, feature, prompts });
  return run();
}

export function isForceLogoutError(error: unknown) {
  return error instanceof ApiError && isForceLogoutDetails(error.details);
}

export function isForceLogoutDetails(details: unknown): details is { forceLogout: true; redirectTo: string } {
  return Boolean(details && typeof details === "object" && "forceLogout" in details);
}

async function getModerationUser(auth: AuthContext): Promise<ModerationMemoryUser> {
  if (!hasDatabase()) {
    const existing = memoryUsers.get(auth.user.sub);
    if (existing) return existing;

    const created = {
      aiBlockedUntil: null,
      aiStrikes: 0,
      email: `${auth.user.sub}@local.marketly`,
      fullName: "Local User",
      id: auth.user.sub,
      status: "active",
    };
    memoryUsers.set(auth.user.sub, created);
    return created;
  }

  await connectToDatabase();
  const user = await UserModel.findById(auth.user.sub)
    .select("email fullName status moderation")
    .lean();

  if (!user) throw apiErrors.unauthorized("User no longer exists.");

  return {
    aiBlockedUntil: user.moderation?.aiBlockedUntil ?? null,
    aiStrikes: user.moderation?.aiStrikes ?? 0,
    email: user.email,
    fullName: user.fullName,
    id: String(user._id),
    lastViolationAt: user.moderation?.lastViolationAt ?? null,
    lastViolationFeature: user.moderation?.lastViolationFeature ?? null,
    lastViolationReason: user.moderation?.lastViolationReason ?? null,
    status: user.status,
  };
}

function assertUserCanUseAI(user: ModerationMemoryUser) {
  if (user.status === "suspended" || user.status === "deleted") {
    throw apiErrors.forbidden(AI_SUSPENSION_MESSAGE, {
      contactPath: "/contact",
      forceLogout: true,
      redirectTo: "/login",
    });
  }

  if (user.aiBlockedUntil && user.aiBlockedUntil.getTime() > Date.now()) {
    throw apiErrors.rateLimited(Math.ceil((user.aiBlockedUntil.getTime() - Date.now()) / 1000));
  }
}

function detectUnsafePrompt(prompt: string): UnsafePromptResult | null {
  const matchedPolicy = unsafePatterns.find(({ pattern }) => pattern.test(prompt));
  if (matchedPolicy) {
    return {
      category: matchedPolicy.category,
      reason: matchedPolicy.reason,
    };
  }

  if (filter.isProfane(prompt)) {
    return {
      category: "profanity",
      reason: "The prompt contains profanity or inappropriate language.",
    };
  }

  return null;
}

async function recordViolation(input: {
  auth: AuthContext;
  category: string;
  email: string;
  feature: string;
  prompt: string;
  reason: string;
}): Promise<never> {
  const timestamp = new Date();

  if (!hasDatabase()) {
    const user = await getModerationUser(input.auth);
    const strikeNumber = user.aiStrikes + 1;
    applyStrikeToMemoryUser(user, strikeNumber, input, timestamp);
    memoryViolations.push({
      category: input.category,
      email: input.email,
      feature: input.feature,
      prompt: truncatePrompt(input.prompt),
      reason: input.reason,
      strikeNumber,
      timestamp,
      userId: input.auth.user.sub,
    });
    throw strikeError(strikeNumber, user.aiBlockedUntil);
  }

  await connectToDatabase();
  const user = await UserModel.findById(input.auth.user.sub).select("+refreshTokens");
  if (!user) throw apiErrors.unauthorized("User no longer exists.");

  const strikeNumber = (user.moderation?.aiStrikes ?? 0) + 1;
  const blockUntil = getBlockUntil(strikeNumber, timestamp);
  const isSuspended = strikeNumber >= AI_MODERATION_CONFIG.MAX_STRIKES;

  user.moderation = {
    ...(user.moderation ?? { aiStrikes: 0 }),
    aiBlockedUntil: isSuspended ? null : blockUntil,
    aiStrikes: strikeNumber,
    lastViolationAt: timestamp,
    lastViolationFeature: input.feature,
    lastViolationReason: input.reason,
    suspendedAt: isSuspended ? timestamp : user.moderation?.suspendedAt ?? null,
    suspensionReason: isSuspended ? input.reason : user.moderation?.suspensionReason ?? null,
  };

  if (isSuspended) {
    user.status = "suspended";
    user.refreshTokens = (user.refreshTokens ?? []).map((session) => ({
      ...session,
      revokedAt: session.revokedAt ?? timestamp,
    }));
  }

  await Promise.all([
    user.save(),
    AIViolationModel.create({
      category: input.category,
      email: user.email,
      feature: input.feature,
      prompt: truncatePrompt(input.prompt),
      reason: input.reason,
      strikeNumber,
      timestamp,
      userId: user._id,
    }),
  ]);

  throw strikeError(strikeNumber, blockUntil);
}

function applyStrikeToMemoryUser(
  user: ModerationMemoryUser,
  strikeNumber: number,
  input: { feature: string; reason: string },
  timestamp: Date,
) {
  const isSuspended = strikeNumber >= AI_MODERATION_CONFIG.MAX_STRIKES;
  user.aiStrikes = strikeNumber;
  user.aiBlockedUntil = isSuspended ? null : getBlockUntil(strikeNumber, timestamp);
  user.lastViolationAt = timestamp;
  user.lastViolationFeature = input.feature;
  user.lastViolationReason = input.reason;
  user.status = isSuspended ? "suspended" : user.status;
  memoryUsers.set(user.id, user);
}

function strikeError(strikeNumber: number, blockUntil?: Date | null): never {
  if (strikeNumber >= AI_MODERATION_CONFIG.MAX_STRIKES) {
    throw apiErrors.forbidden(AI_SUSPENSION_MESSAGE, {
      contactPath: "/contact",
      forceLogout: true,
      redirectTo: "/login",
      strikeNumber,
    });
  }

  const retryAfterSeconds = blockUntil ? Math.max(1, Math.ceil((blockUntil.getTime() - Date.now()) / 1000)) : undefined;
  const message = strikeNumber === 1
    ? `${AI_POLICY_WARNING_MESSAGE} AI features are disabled for 15 minutes.`
    : `${AI_POLICY_WARNING_MESSAGE} AI features are disabled for 4 hours.`;

  throw new ApiError("FORBIDDEN", message, {
    details: {
      blockedUntil: blockUntil?.toISOString(),
      retryAfterSeconds,
      strikeNumber,
    },
    status: 403,
  });
}

function getBlockUntil(strikeNumber: number, from: Date) {
  if (strikeNumber === 1) return new Date(from.getTime() + AI_MODERATION_CONFIG.FIRST_BLOCK_DURATION_MS);
  if (strikeNumber === 2) return new Date(from.getTime() + AI_MODERATION_CONFIG.SECOND_BLOCK_DURATION_MS);
  return null;
}

function truncatePrompt(prompt: string) {
  return prompt.trim().slice(0, AI_MODERATION_CONFIG.MAX_LOGGED_PROMPT_LENGTH);
}

function hasDatabase() {
  return Boolean(process.env.MONGODB_URI);
}
