import { createModeratedApiHandler } from "@/server/moderation/with-moderation";

export const POST = createModeratedApiHandler(
  async ({ request }) => {
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const { text } = await request.json() as { text?: string };
    if (!text?.trim()) return { audio: null };

    if (!elevenKey) return { audio: null };

    try {
      const res = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL?output_format=mp3_44100_128",
        {
          method: "POST",
          headers: { "xi-api-key": elevenKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.slice(0, 4000),
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );

      if (!res.ok) {
        console.error("ElevenLabs TTS failed", res.status, await res.text());
        return { audio: null };
      }

      const buf = await res.arrayBuffer();
      return { audio: `data:audio/mpeg;base64,${Buffer.from(buf).toString("base64")}` };
    } catch {
      return { audio: null };
    }
  },
  { feature: "tts" },
);