import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { requireAuth } from "@/server/security/auth-guard";
import { UserModel } from "@/server/database/models/user.model";
import { connectToDatabase } from "@/server/database";

export const POST = createApiHandler(
  async ({ meta, request }) => {
    const auth = await requireAuth(request);

    await connectToDatabase();
    await UserModel.findByIdAndUpdate(auth.user.sub, { lastActiveAt: new Date() });

    return jsonSuccess({ success: true }, meta);
  },
  { rateLimit: { keyPrefix: "users.ping", limit: 60, windowMs: 60 * 1000 } }
);
