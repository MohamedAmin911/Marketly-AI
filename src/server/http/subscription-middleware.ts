import type { NextRequest } from "next/server";
import { AI_SUSPENSION_MESSAGE } from "@/server/config/moderation";
import { UserModel, type IUser } from "@/server/database/models/user.model";
import { connectToDatabase } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import { verifyJwt } from "@/server/security/jwt";

/**
 * Ensures the user has a specific feature enabled via their subscription plan or is an admin.
 */
export async function requireFeature(request: NextRequest, feature: keyof IUser["features"]) {
  const token = request.cookies.get("marketly_access")?.value || request.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!token) throw apiErrors.unauthorized();
  
  const decoded = await verifyJwt(token, "access");
  if (!decoded || !decoded.sub) throw apiErrors.unauthorized("Invalid token");

  await connectToDatabase();
  const user = await UserModel.findById(decoded.sub).lean();
  if (!user) throw apiErrors.notFound("User not found");
  if (user.status === "suspended" || user.status === "deleted") {
    throw apiErrors.forbidden(AI_SUSPENSION_MESSAGE, {
      contactPath: "/contact",
      forceLogout: true,
      redirectTo: "/login",
    });
  }

  if (user.role === "admin") return user; // Admin bypass

  if (!user.features || !user.features[feature]) {
    throw apiErrors.forbidden("Feature not available in your subscription.");
  }

  return user;
}

/**
 * Retrieves the current authenticated user.
 */
export async function requireUser(request: NextRequest) {
  const token = request.cookies.get("marketly_access")?.value || request.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!token) throw apiErrors.unauthorized();
  
  const decoded = await verifyJwt(token, "access");
  if (!decoded || !decoded.sub) throw apiErrors.unauthorized("Invalid token");

  await connectToDatabase();
  const user = await UserModel.findById(decoded.sub).lean();
  if (!user) throw apiErrors.notFound("User not found");
  if (user.status === "suspended" || user.status === "deleted") {
    throw apiErrors.forbidden(AI_SUSPENSION_MESSAGE, {
      contactPath: "/contact",
      forceLogout: true,
      redirectTo: "/login",
    });
  }

  return user;
}

/**
 * Ensures the current authenticated user is an admin.
 */
export async function requireAdmin(request: NextRequest) {
  const user = await requireUser(request);
  if (user.role !== "admin") {
    throw apiErrors.forbidden("Admin privileges required.");
  }
  return user;
}
