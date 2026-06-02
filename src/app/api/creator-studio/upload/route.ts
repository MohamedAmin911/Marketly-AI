import { createApiHandler } from "@/server/http/route-handler";
import { parseFormData } from "@/server/http/validation";
import { requireAuth } from "@/server/security/auth-guard";
import { creatorUploadSchema } from "@/server/creator-studio/schemas";
import { uploadCreatorImage } from "@/server/creator-studio/service";

export const POST = createApiHandler(
  async ({ request }) => {
    await requireAuth(request);
    const body = await parseFormData(request, creatorUploadSchema);

    return uploadCreatorImage(body);
  },
  { rateLimit: { keyPrefix: "creator.upload", limit: 30, windowMs: 60 * 1000 } },
);
