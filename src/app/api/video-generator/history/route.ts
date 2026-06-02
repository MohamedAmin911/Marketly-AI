import { createApiHandler } from "@/server/http/route-handler";
import { getVideoAuth } from "@/server/video-generator/auth";
import { listProductVideos } from "@/server/video-generator/service";

export const runtime = "nodejs";

export const GET = createApiHandler(async ({ request }) => {
  const auth = await getVideoAuth(request);
  return listProductVideos(auth);
});
