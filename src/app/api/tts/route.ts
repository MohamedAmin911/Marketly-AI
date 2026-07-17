import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";

export const POST = createApiHandler(async ({ request }) => {
  await requireAuth(request);

  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL";
  const { text } = await request.json() as { text?: string };
  if (!text?.trim()) return { audio: null, error: "Text is required." };

  if (!elevenKey) return { audio: null, error: "ELEVENLABS_API_KEY is not configured." };

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: { "xi-api-key": elevenKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({
          text: text.slice(0, 4000),
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("ElevenLabs TTS failed", res.status, errorBody);
      return { audio: null, error: `ElevenLabs TTS failed with status ${res.status}.` };
    }

    const buf = await res.arrayBuffer();
    return { audio: `data:audio/mpeg;base64,${Buffer.from(buf).toString("base64")}`, error: null };
  } catch (error) {
    console.error("ElevenLabs TTS request crashed", error);
    return { audio: null, error: "ElevenLabs TTS request failed." };
  }
});
