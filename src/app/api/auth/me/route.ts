import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";
import { getPublicUser } from "@/server/services/auth-service";

export const GET = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);

  return {
    user: await getPublicUser(auth.user.sub),
  };
});
