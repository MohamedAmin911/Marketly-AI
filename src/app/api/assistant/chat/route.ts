import { parseWithSchema } from "@/server/http/validation";
import { assistantChatRequestSchema, assistantChatResponseSchema } from "@/server/schemas/ai";
import { generateAIResponse } from "@/server/services/ai-generation-service";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";
import { AssistantSessionModel } from "@/server/database/models/assistant-session.model";
import { AssistantMessageModel } from "@/server/database/models/assistant-message.model";

export const runtime = "nodejs";

export const POST = createModeratedApiHandler(
  async ({ auth, request }) => {
    const raw = (await request.json()) as Record<string, unknown>;
    const body = parseWithSchema(assistantChatRequestSchema, raw);
    const result = parseWithSchema(assistantChatResponseSchema, await generateAIResponse(body, auth));

    await persistLegacySessionMessages({
      answer: result.answer,
      message: body.message,
      sessionId: typeof raw.sessionId === "string" ? raw.sessionId : undefined,
      userId: auth.user.sub,
    });

    return {
      ...result,
      success: true,
    };
  },
  { feature: "ai_assistant", rateLimit: { keyPrefix: "assistant.chat", limit: 60, windowMs: 60 * 1000 } },
);

async function persistLegacySessionMessages(input: {
  answer: string;
  message: string;
  sessionId?: string;
  userId: string;
}) {
  let session = input.sessionId ? await AssistantSessionModel.findById(input.sessionId) : null;

  if (!session) {
    session = await AssistantSessionModel.create({
      provider: "openai",
      title: input.message.substring(0, 30) + (input.message.length > 30 ? "..." : ""),
      user: input.userId,
    });
  }

  await AssistantMessageModel.create([
    {
      content: input.message,
      role: "user",
      session: session._id,
    },
    {
      content: input.answer,
      role: "assistant",
      session: session._id,
    },
  ]);
}
