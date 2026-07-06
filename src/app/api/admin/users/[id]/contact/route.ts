import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { requireAuth, requireRole } from "@/server/security/auth-guard";
import { UserModel } from "@/server/database/models/user.model";
import { connectToDatabase } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import { parseJsonBody } from "@/server/http/validation";
import { z } from "zod";
import { sendAdminEmail } from "@/server/services/mail-service";

const contactSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type UserParams = {
  id: string;
};

export const POST = createApiHandler<unknown, UserParams>(
  async ({ meta, request, params }) => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);

    const body = await parseJsonBody(request, contactSchema);
    const userId = params?.id;

    if (!userId) {
      throw apiErrors.badRequest("User ID is required");
    }

    await connectToDatabase();
    
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      throw apiErrors.notFound("User not found");
    }

    await sendAdminEmail(targetUser.email, body.subject, body.message);

    return jsonSuccess({ success: true, message: "Email sent successfully" }, meta);
  }
);
