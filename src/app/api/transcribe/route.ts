// import { NextRequest, NextResponse } from "next/server";
// import { requireAuth } from "@/server/security/auth-guard";

// export const POST = async (request: NextRequest) => {
//   await requireAuth(request);

//   const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
//   if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

//   const formData = await request.formData();
//   const audio = formData.get("audio") as Blob | null;
//   if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

//   // Use OpenAI Whisper directly (works with OPENAI_API_KEY)
//   const form = new FormData();
//   form.append("file", audio, "recording.webm");
//   form.append("model", "whisper-1");

//   const whisperKey = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY;
//   const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
//     method: "POST",
//     headers: { Authorization: `Bearer ${whisperKey}` },
//     body: form,
//   });

//   if (!res.ok) {
//     const err = await res.text();
//     console.error("Whisper failed:", err);
//     return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
//   }

//   const data = await res.json() as { text?: string };
//   return NextResponse.json({ text: data.text ?? "" });
// };

// import { NextRequest, NextResponse } from "next/server";
// import { requireAuth } from "@/server/security/auth-guard";

// export const POST = async (request: NextRequest) => {
//   await requireAuth(request);

//   const openAiKey = process.env.OPENAI_API_KEY;
//   if (!openAiKey) {
//     return NextResponse.json(
//       { error: "OPENAI_API_KEY required for voice transcription. Add it to .env.local" },
//       { status: 500 }
//     );
//   }

//   const formData = await request.formData();
//   const audio = formData.get("audio") as Blob | null;
//   if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

//   const form = new FormData();
//   form.append("file", audio, "recording.webm");
//   form.append("model", "whisper-1");

//   const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
//     method: "POST",
//     headers: { Authorization: `Bearer ${openAiKey}` },
//     body: form,
//   });

//   if (!res.ok) {
//     const err = await res.text();
//     console.error("Whisper failed:", res.status, err);
//     return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
//   }

//   const data = await res.json() as { text?: string };
//   return NextResponse.json({ text: data.text ?? "" });
// };

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/security/auth-guard";
import { getAIProvider } from "@/lib/services/ai-factory";

export const POST = async (request: NextRequest) => {
  await requireAuth(request);

  const formData = await request.formData();
  const audio = formData.get("audio") as Blob | null;

  if (!audio) {
    return NextResponse.json(
      { error: "No audio file received" },
      { status: 400 }
    );
  }

  try {
    const text = await getAIProvider().transcribeAudio(audio);

    return NextResponse.json({
      text: text ?? "",
    });
  } catch (error) {
    console.error("Voice transcription error:", error);

    return NextResponse.json(
      { error: "Voice transcription failed" },
      { status: 500 }
    );
  }
};