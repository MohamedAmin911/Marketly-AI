import { NextResponse } from "next/server";

import { apiErrors } from "@/server/errors/api-error";
import { createApiHandler } from "@/server/http/route-handler";
import { parseQueryParams } from "@/server/http/validation";
import { getVideoAuth } from "@/server/video-generator/auth";
import { videoStatusQuerySchema } from "@/server/video-generator/schemas";
import { getVideoExport } from "@/server/video-generator/service";

export const runtime = "nodejs";

export const GET = createApiHandler(async ({ request }) => {
  await getVideoAuth(request);
  const query = parseQueryParams(request, videoStatusQuerySchema);
  const exported = await getVideoExport(query.id);

  if (!exported) throw apiErrors.notFound("Video export is not ready.");

  return NextResponse.redirect(exported.url, {
    headers: {
      "Content-Disposition": `attachment; filename="${exported.filename}"`,
      "Content-Type": exported.contentType,
    },
  });
});
