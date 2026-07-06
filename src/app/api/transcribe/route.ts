import { apiErrors } from "@/server/errors/api-error";
import { createModeratedApiHandler } from "@/server/moderation/with-moderation";
import { getAIProvider } from "@/lib/services/ai-factory";

export const POST = createModeratedApiHandler(
  async ({ request }) => {
    const formData = await request.formData();
    const audio = formData.get("audio") as Blob | null;

    if (!audio) throw apiErrors.badRequest("No audio file received.");

    const text = await getAIProvider().transcribeAudio(audio);

    return { text: text ?? "" };
  },
  {
    feature: "transcription",
    requirePrompt: false,
    rateLimit: { keyPrefix: "transcribe", limit: 30, windowMs: 60 * 1000 },
  },
);
