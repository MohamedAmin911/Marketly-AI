import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { parseJsonBody } from "@/server/http/validation";
import { verifyEmail } from "@/server/services/auth-service";
import { z } from "zod";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const POST = createApiHandler(
  async ({ meta, request }) => {
    const body = await parseJsonBody(request, verifyEmailSchema);
    await verifyEmail(body.token);

    return jsonSuccess({ success: true }, meta);
  },
  { rateLimit: { keyPrefix: "auth.verify-email", limit: 10, windowMs: 60 * 1000 } },
);
