import type { NextRequest } from "next/server";

import { completeOAuth } from "@/server/services/oauth-service";

export function GET(request: NextRequest) {
  return completeOAuth(request, "github");
}
