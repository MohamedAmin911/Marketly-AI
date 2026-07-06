import type { NextRequest } from "next/server";

import { apiErrors } from "@/server/errors/api-error";
import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth, type AuthContext } from "@/server/security/auth-guard";
import { checkModeration, extractPrompt, type ModerationResult } from "@/server/moderation/moderation-service";
import type { AiFeature } from "@/server/database/models/moderation-violation.model";

type ModeratedHandlerContext<TParams = unknown> = {
  auth: AuthContext;
  moderation: Extract<ModerationResult, { allowed: true }>;
  params?: TParams;
  request: NextRequest;
};

type ModeratedHandlerOptions = {
  feature: AiFeature | ((body: Record<string, unknown>) => AiFeature);
  getPrompt?: (body: Record<string, unknown>) => string;
  requirePrompt?: boolean;
  rateLimit?: {
    keyPrefix: string;
    limit: number;
    windowMs: number;
  };
};

type ModeratedHandler<TData, TParams = unknown> = (
  context: ModeratedHandlerContext<TParams>,
) => Promise<TData>;

export function createModeratedApiHandler<TData, TParams = unknown>(
  handler: ModeratedHandler<TData, TParams>,
  options: ModeratedHandlerOptions,
) {
  return createApiHandler<TData, TParams>(
    async ({ request, params }) => {
      const auth = await requireAuth(request);
      const moderationBody = await getModerationBody(request, options.getPrompt);

      if ((options.requirePrompt ?? true) && !moderationBody.prompt.trim()) {
        throw apiErrors.badRequest("A prompt or text input is required for this AI request.");
      }

      const result = await checkModeration({
        userId: auth.user.sub,
        prompt: moderationBody.prompt,
        feature: typeof options.feature === "function" ? options.feature(moderationBody.body) : options.feature,
        userIp: getClientIp(request),
      });

      if (!result.allowed) {
        if (result.statusCode === 400) throw apiErrors.badRequest(result.reason);
        throw apiErrors.forbidden(result.reason);
      }

      return handler({ auth, moderation: result, params, request });
    },
    { rateLimit: options.rateLimit },
  );
}

async function getModerationBody(
  request: NextRequest,
  customExtractor?: (body: Record<string, unknown>) => string,
): Promise<{ body: Record<string, unknown>; prompt: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  const cloned = request.clone();

  try {
    if (contentType.includes("application/json")) {
      const body = (await cloned.json()) as Record<string, unknown>;
      return { body, prompt: customExtractor ? customExtractor(body) : extractPrompt(body) };
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await cloned.formData();
      const body = formDataToRecord(formData);
      return { body, prompt: customExtractor ? customExtractor(body) : extractPrompt(body) };
    }
  } catch {
    throw apiErrors.badRequest("Request body could not be parsed for moderation.");
  }

  return { body: {}, prompt: "" };
}

function formDataToRecord(formData: FormData): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;

    if (key in body) {
      const existing = body[key];
      body[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      body[key] = value;
    }
  }

  return body;
}

function getClientIp(request: NextRequest): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;
}
