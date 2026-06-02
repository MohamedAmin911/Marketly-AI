import { createApiHandler } from "@/server/http/route-handler";
import { parseQueryParams } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { historyQuerySchema } from "@/server/creator-studio/schemas";
import { listCreatorHistory } from "@/server/creator-studio/service";

export const GET = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  const query = parseQueryParams(request, historyQuerySchema);

  return listCreatorHistory(query, auth);
});
