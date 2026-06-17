import { connectToDatabase } from "@/server/database";
import { createApiHandler } from "@/server/http/route-handler";
import { ChatSession } from "@/server/models/chat-session";
import { requireAuth } from "@/server/security/auth-guard";

export const GET = createApiHandler(async ({ request, params }) => {
  const auth = await requireAuth(request);
  await connectToDatabase();
  const { id } = await params as { id: string };

  const session = await ChatSession.findOne({ _id: id, userId: auth.user.sub }).lean() as {
    messages: { id: string; role: string; content: string }[];
    title: string;
  } | null;

  if (!session) return { messages: [], title: "New Chat" };
  return { messages: session.messages, title: session.title };
});

export const PATCH = createApiHandler(async ({ request, params }) => {
  const auth = await requireAuth(request);
  await connectToDatabase();
  const { id } = await params as { id: string };

  const body = await request.json() as {
    message?: { id: string; role: string; content: string };
    title?: string;
  };

  if (body.message) {
    await ChatSession.findOneAndUpdate(
      { _id: id, userId: auth.user.sub },
      { $push: { messages: body.message }, $set: { updatedAt: new Date() } },
    );
  } else if (body.title) {
    await ChatSession.findOneAndUpdate(
      { _id: id, userId: auth.user.sub },
      { $set: { title: body.title, updatedAt: new Date() } },
    );
  }

  return { ok: true };
});

export const DELETE = createApiHandler(async ({ request, params }) => {
  const auth = await requireAuth(request);
  await connectToDatabase();
  const { id } = await params as { id: string };

  await ChatSession.findOneAndDelete({ _id: id, userId: auth.user.sub });
  return { ok: true };
});
