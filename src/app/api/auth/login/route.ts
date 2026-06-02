import { NextResponse } from "next/server";

import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { parseJsonBody } from "@/server/http/validation";
import { setAuthCookies } from "@/server/security/cookies";
import { getClientIp } from "@/server/security/rate-limit";
import { login } from "@/server/services/auth-service";
import { loginRequestSchema } from "@/server/schemas/auth";

export const POST = createApiHandler(
  async ({ meta, request }) => {
    const body = await parseJsonBody(request, loginRequestSchema);
    const result = await login(body, {
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    const response = jsonSuccess({ user: result.user }, meta);

    setAuthCookies(response, result.tokens);

    return response;
  },
  { rateLimit: { keyPrefix: "auth.login", limit: 10, windowMs: 60 * 1000 } },
);

export function GET() {
  return NextResponse.json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } }, { status: 405 });
}
