import { createModeratedApiHandler } from "@/server/moderation/with-moderation";
import { parseJsonBody } from "@/server/http/validation";
import { requireIdempotencyKey, runIdempotently } from "@/server/security/idempotency";
import { creatorGenerationSchema } from "@/server/creator-studio/schemas";
import { generateCreatorAssets } from "@/server/creator-studio/service";

export const POST = createModeratedApiHandler(
  async ({ auth, request }) => {
    const idempotencyKey = requireIdempotencyKey(request.headers.get("idempotency-key"));
    const body = await parseJsonBody(request, creatorGenerationSchema);

    return runIdempotently(`${auth.user.tenantId}:creator:${idempotencyKey}`, () => generateCreatorAssets(body, auth));
  },
  { feature: "image_generation", rateLimit: { keyPrefix: "creator.generate", limit: 20, windowMs: 60 * 1000 } },
);