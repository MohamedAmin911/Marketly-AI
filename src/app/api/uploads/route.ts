import { createApiHandler } from "@/server/http/route-handler";
import { parseFormData } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { uploadRequestSchema } from "@/server/schemas/upload";
import { storeUpload } from "@/server/services/upload-service";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await requireAuth(request);
    const body = await parseFormData(request, uploadRequestSchema);

    return storeUpload(body, auth);
  },
  { rateLimit: { keyPrefix: "uploads", limit: 30, windowMs: 60 * 1000 } },
);
