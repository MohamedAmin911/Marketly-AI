import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { requireIdempotencyKey, runIdempotently } from "@/server/security/idempotency";
import { creatorGenerationSchema } from "@/server/creator-studio/schemas";
import { generateCreatorAssets } from "@/server/creator-studio/service";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const idempotencyKey = requireIdempotencyKey(request.headers.get("idempotency-key"));
    const body = await parseJsonBody(request, creatorGenerationSchema);

    return runIdempotently(`${auth.user.tenantId}:creator:${idempotencyKey}`, () => generateCreatorAssets(body, auth));
  },
  { rateLimit: { keyPrefix: "creator.generate", limit: 20, windowMs: 60 * 1000 } },
);
