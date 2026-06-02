import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { parseJsonBody } from "@/server/http/validation";
import { setAuthCookies } from "@/server/security/cookies";
import { getClientIp } from "@/server/security/rate-limit";
import { signupRequestSchema } from "@/server/schemas/auth";
import { signup } from "@/server/services/auth-service";

export const POST = createApiHandler(
  async ({ meta, request }) => {
    const body = await parseJsonBody(request, signupRequestSchema);
    const result = await signup(body, {
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    const response = jsonSuccess({ user: result.user }, meta);

    setAuthCookies(response, result.tokens);

    return response;
  },
  { rateLimit: { keyPrefix: "auth.signup", limit: 8, windowMs: 60 * 1000 } },
);
