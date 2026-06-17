import { connectToDatabase } from "@/server/database";
import { createApiHandler } from "@/server/http/route-handler";
import { ChatSession } from "@/server/database/models/chat-session.model";
import { requireAuth } from "@/server/security/auth-guard";

export const POST = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  await connectToDatabase();

  const result = await ChatSession.deleteMany({
    userId: auth.user.sub,
    messages: { $size: 0 },
  });

  return { deleted: result.deletedCount };
});
