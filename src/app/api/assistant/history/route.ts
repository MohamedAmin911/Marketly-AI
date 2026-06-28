import { createApiHandler } from "@/server/http/route-handler";
import { requireFeature } from "@/server/http/subscription-middleware";
import { AssistantSessionModel } from "@/server/database/models/assistant-session.model";
import { AssistantMessageModel } from "@/server/database/models/assistant-message.model";

export const GET = createApiHandler(async ({ request }) => {
  const user = await requireFeature(request, "aiAssistant");
  
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  if (sessionId) {
    const session = await AssistantSessionModel.findOne({ _id: sessionId, user: user._id });
    if (!session) return { messages: [] };

    const messages = await AssistantMessageModel.find({ session: session._id }).sort({ createdAt: 1 });
    return { session, messages };
  } else {
    const sessions = await AssistantSessionModel.find({ user: user._id }).sort({ createdAt: -1 }).limit(20);
    return { sessions };
  }
});
