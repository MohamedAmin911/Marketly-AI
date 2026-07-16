import type { NextRequest } from "next/server";

import { AI_SUSPENSION_MESSAGE } from "@/server/config/moderation";
import { connectToDatabase, UserModel } from "@/server/database";
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
  await assertActiveAccount(user);

  return { user };
}

export function requireRole(auth: AuthContext, roles: JwtPayload["role"][]) {
  if (!roles.includes(auth.user.role)) throw apiErrors.forbidden();
}

async function assertActiveAccount(user: JwtPayload) {
  if (!process.env.MONGODB_URI) return;

  await connectToDatabase();
  const account = await UserModel.findById(user.sub).select("status").lean();

  if (!account) throw apiErrors.unauthorized("User no longer exists.");
  if (account.status === "suspended" || account.status === "deleted") {
    throw apiErrors.forbidden(AI_SUSPENSION_MESSAGE, {
      contactPath: "/contact",
      forceLogout: true,
      redirectTo: "/login",
    });
  }
}
