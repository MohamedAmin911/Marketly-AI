import { apiErrors } from "@/server/errors/api-error";
import { createApiHandler } from "@/server/http/route-handler";
import { parseQueryParams } from "@/server/http/validation";
import { getVideoAuth } from "@/server/video-generator/auth";
import { videoStatusQuerySchema } from "@/server/video-generator/schemas";
import { getVideoJob } from "@/server/video-generator/service";

export const runtime = "nodejs";

export const GET = createApiHandler(async ({ request }) => {
  await getVideoAuth(request);
  const query = parseQueryParams(request, videoStatusQuerySchema);
  const job = await getVideoJob(query.id);

  if (!job) throw apiErrors.notFound("Video render job was not found.");
  return job;
});
