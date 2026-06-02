import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { generationIdSchema } from "@/server/creator-studio/schemas";
import { markCreatorDownloaded } from "@/server/creator-studio/service";

export const POST = createApiHandler(async ({ request }) => {
  await requireAuth(request);
  const body = await parseJsonBody(request, generationIdSchema);

  return markCreatorDownloaded(body.generationId);
});
