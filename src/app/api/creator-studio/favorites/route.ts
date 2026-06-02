import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { favoriteMutationSchema } from "@/server/creator-studio/schemas";
import { listCreatorFavorites, setCreatorFavorite } from "@/server/creator-studio/service";

export const GET = createApiHandler(async ({ request }) => {
  await requireAuth(request);

  return listCreatorFavorites();
});

export const POST = createApiHandler(async ({ request }) => {
  await requireAuth(request);
  const body = await parseJsonBody(request, favoriteMutationSchema);

  return setCreatorFavorite(body.generationId, body.favorited);
});
