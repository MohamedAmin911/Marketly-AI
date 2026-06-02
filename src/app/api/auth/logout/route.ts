import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { clearAuthCookies } from "@/server/security/cookies";
import { revokeRefreshToken } from "@/server/services/auth-service";

export const POST = createApiHandler(async ({ meta, request }) => {
  const refreshToken = request.cookies.get("marketly_refresh")?.value;
  await revokeRefreshToken(refreshToken);

  const response = jsonSuccess({ loggedOut: true }, meta);
  clearAuthCookies(response);

  return response;
});
