import { createApiHandler } from "@/server/http/route-handler";
import { requireAdmin } from "@/server/http/subscription-middleware";
import { UserModel } from "@/server/database/models/user.model";

export const GET = createApiHandler(async ({ request }) => {
  await requireAdmin(request);
  
  const users = await UserModel.find({}, {
    passwordHash: 0, 
    refreshTokens: 0,
    verificationToken: 0,
  }).sort({ createdAt: -1 }).limit(100);

  return { users };
});
