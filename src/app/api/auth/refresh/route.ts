import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { parseJsonBody } from "@/server/http/validation";
import { apiErrors } from "@/server/errors/api-error";
import { setAuthCookies } from "@/server/security/cookies";
import { getClientIp } from "@/server/security/rate-limit";
import { refreshRequestSchema } from "@/server/schemas/auth";
import { refresh } from "@/server/services/auth-service";

export const POST = createApiHandler(
  async ({ meta, request }) => {
    const cookieToken = request.cookies.get("marketly_refresh")?.value;
    const body = request.headers.get("content-type")?.includes("application/json")
      ? await parseJsonBody(request, refreshRequestSchema)
      : { refreshToken: undefined };
    const refreshToken = body.refreshToken ?? cookieToken;

    if (!refreshToken) throw apiErrors.unauthorized("Refresh token is required.");

    const tokens = await refresh(refreshToken, {
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    const response = jsonSuccess({ refreshed: true }, meta);

    setAuthCookies(response, tokens);

    return response;
  },
  { rateLimit: { keyPrefix: "auth.refresh", limit: 30, windowMs: 60 * 1000 } },
);
