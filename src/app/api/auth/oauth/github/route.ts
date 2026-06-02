import type { NextRequest } from "next/server";

import { startOAuth } from "@/server/services/oauth-service";

export function GET(request: NextRequest) {
  return startOAuth(request, "github");
}
