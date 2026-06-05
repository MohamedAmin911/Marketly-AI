import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody, parseQueryParams } from "@/server/http/validation";
import { retrieveMemorySnapshot } from "@/server/ai/memory/retrieval-service";
import { updateAIMemory } from "@/server/ai/memory/update-service";
import { requireAuth } from "@/server/security/auth-guard";
import { aiMemoryQuerySchema, aiMemoryUpdateSchema } from "@/server/schemas/ai-memory";

export const GET = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const query = parseQueryParams(request, aiMemoryQuerySchema);

    return retrieveMemorySnapshot(auth.user.sub, query.brandId);
  },
  { rateLimit: { keyPrefix: "ai.memory.read", limit: 60, windowMs: 60 * 1000 } },
);

export const PATCH = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseJsonBody(request, aiMemoryUpdateSchema);

    return updateAIMemory({
      ...body,
      userId: auth.user.sub,
    });
  },
  { rateLimit: { keyPrefix: "ai.memory.update", limit: 30, windowMs: 60 * 1000 } },
);
