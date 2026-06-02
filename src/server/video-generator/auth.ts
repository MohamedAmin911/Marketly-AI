import type { NextRequest } from "next/server";

import type { AuthContext } from "@/server/security/auth-guard";
import { requireAuth } from "@/server/security/auth-guard";

export async function getVideoAuth(request: NextRequest): Promise<AuthContext> {
  try {
    return await requireAuth(request);
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;

    return {
      user: {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        jti: "dev-video-session",
        kind: "access",
        role: "marketer",
        sub: "dev-video-user",
        tenantId: "dev-tenant",
      },
    };
  }
}
