import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah — ElevenLabs

export const POST = createApiHandler(async ({ request }) => {
  await requireAuth(request);

  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenKey) {
    return Response.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
  }

  const { text } = await request.json() as { text?: string };
  if (!text?.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
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
    const err = await res.text();
    console.error("ElevenLabs TTS failed", res.status, err);
    return Response.json({ error: "TTS failed" }, { status: 502 });
  }

  const buf = await res.arrayBuffer();
  const b64 = Buffer.from(buf).toString("base64");
  return Response.json({ audio: `data:audio/mpeg;base64,${b64}` });
});