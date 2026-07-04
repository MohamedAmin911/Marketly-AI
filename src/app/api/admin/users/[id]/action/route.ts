import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { requireAuth, requireRole } from "@/server/security/auth-guard";
import { UserModel } from "@/server/database/models/user.model";
import { connectToDatabase } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import { parseJsonBody } from "@/server/http/validation";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["block", "unblock", "delete"]),
});

export const POST = createApiHandler<any, { id: string }>(
  async ({ meta, request, params }) => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);

    const body = await parseJsonBody(request, actionSchema);
    const userId = params?.id;

    if (!userId) {
      throw apiErrors.badRequest("User ID is required");
    }

    // Don't allow blocking/deleting self
    if (userId === auth.user.sub) {
      throw apiErrors.forbidden("You cannot perform this action on yourself.");
    }

    await connectToDatabase();
    
    // Check if targeting the seeded admin
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      throw apiErrors.notFound("User not found");
    }
    
    if (targetUser.username === "admin") {
      throw apiErrors.forbidden("Cannot modify the root admin account.");
    }

    if (body.action === "delete") {
      await UserModel.findByIdAndDelete(userId);
      return jsonSuccess({ success: true, message: "User deleted successfully" }, meta);
    } else if (body.action === "block") {
      await UserModel.findByIdAndUpdate(userId, { status: "suspended" });
      return jsonSuccess({ success: true, message: "User blocked successfully" }, meta);
    } else if (body.action === "unblock") {
      await UserModel.findByIdAndUpdate(userId, { status: "active" });
      return jsonSuccess({ success: true, message: "User unblocked successfully" }, meta);
    }

    throw apiErrors.badRequest("Invalid action");
  }
);
