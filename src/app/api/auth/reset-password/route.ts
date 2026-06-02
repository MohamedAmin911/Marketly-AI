import { createApiHandler } from "@/server/http/route-handler";
import { parseJsonBody } from "@/server/http/validation";
import { resetPasswordRequestSchema } from "@/server/schemas/auth";
import { resetPassword } from "@/server/services/auth-service";

export const POST = createApiHandler(
  async ({ request }) => {
    const body = await parseJsonBody(request, resetPasswordRequestSchema);

    return resetPassword(body);
  },
  { rateLimit: { keyPrefix: "auth.reset", limit: 10, windowMs: 60 * 1000 } },
);
