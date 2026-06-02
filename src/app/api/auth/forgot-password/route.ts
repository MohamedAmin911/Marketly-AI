import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { forgotPasswordRequestSchema } from "@/server/schemas/auth";
import { requestPasswordReset } from "@/server/services/auth-service";

export const POST = createApiHandler(
  async ({ request }) => {
    const body = await parseJsonBody(request, forgotPasswordRequestSchema);

    return requestPasswordReset(body);
  },
  { rateLimit: { keyPrefix: "auth.forgot", limit: 5, windowMs: 60 * 1000 } },
);
