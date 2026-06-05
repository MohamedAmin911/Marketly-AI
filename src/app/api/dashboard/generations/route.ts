import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";
import { getDashboardGenerations } from "@/server/services/dashboard-service";

export const GET = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);

  return getDashboardGenerations(auth);
});
