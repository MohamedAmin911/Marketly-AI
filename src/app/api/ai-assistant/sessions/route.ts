import { connectToDatabase } from "@/server/database";
import { createApiHandler } from "@/server/http/route-handler";
import { ChatSession } from "@/server/models/chat-session";
import { requireAuth } from "@/server/security/auth-guard";

export const GET = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  await connectToDatabase();

  const sessions = await ChatSession.find({ userId: auth.user.sub })
    .select("_id title createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean();

  return { sessions };
});

export const POST = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  await connectToDatabase();

  const session = await ChatSession.create({
    userId: auth.user.sub,
    title: "New Chat",
    messages: [],
  });

  return {
    session: {
      _id: session._id.toString(),
      title: session.title,
      messages: [],
    },
  };
});
