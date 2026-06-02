import type { NextRequest } from "next/server";

import { apiErrors } from "@/server/errors/api-error";
import { verifyJwt, type JwtPayload } from "@/server/security/jwt";

export type AuthContext = {
  user: JwtPayload;
};

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cookieToken = request.cookies.get("marketly_access")?.value;
  const token = bearer ?? cookieToken;

  if (!token) throw apiErrors.unauthorized();

  const user = await verifyJwt(token, "access");

  return { user };
}

export function requireRole(auth: AuthContext, roles: JwtPayload["role"][]) {
  if (!roles.includes(auth.user.role)) throw apiErrors.forbidden();
}
