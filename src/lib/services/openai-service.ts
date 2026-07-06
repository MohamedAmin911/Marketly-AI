import OpenAI from "openai";
import { apiErrors } from "@/server/errors/api-error";

const RATE_LIMIT_RETRIES = 4;
const RATE_LIMIT_BASE_DELAY_MS = 2_000;

let client: OpenAI | null = null;

async function retryOnRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RATE_LIMIT_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error && (error.message.includes("429") || /quota|exceeded/i.test(error.message))) {
        if (attempt < RATE_LIMIT_RETRIES - 1) {
          const delay = RATE_LIMIT_BASE_DELAY_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw apiErrors.rateLimited(60);
      }
      throw error;
    }
  }
  throw lastError;
}

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured. Add it to .env.local to use AI generation features."
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export type OpenAIImageResult = {
  imageUrl: string;
  revisedPrompt?: string;
};

export type OpenAIImageModel =
  | "gpt-image-1"
  | "gpt-image-1-mini"
  | "gpt-image-1.5"
  | "gpt-image-2"
  | "gpt-image-2-2026-04-21"
  | "chatgpt-image-latest"
  | "dall-e-2"
  | "dall-e-3";

export type OpenAIImagesGenerateInput = {
  prompt: string;
  model?: OpenAIImageModel;
  n?: number;
  quality?: "standard" | "hd" | "low" | "medium" | "high" | "auto";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  style?: "vivid" | "natural";
  outputFormat?: "png" | "jpeg" | "webp";
  background?: "transparent" | "opaque" | "auto";
};

type OpenAIImageData = {
  b64_json?: string;
  revised_prompt?: string;
  url?: string;
};

function normalizeDalleQuality(quality: string): string {
  if (quality === "low" || quality === "medium" || quality === "high") return "standard";
  if (quality === "auto") return "hd";
  return quality;
}

function normalizeGptImageQuality(quality: string): string {
  if (quality === "hd") return "high";
  if (quality === "standard") return "medium";
  return quality;
}

function generateMockImage(input: OpenAIImagesGenerateInput): OpenAIImageResult {
  const size = input.size ?? "1024x1024";

  const imageUrl = `https://placehold.co/${size}/1a1a2e/e94560?text=MOCK+TEST+IMAGE&font=montserrat`;

  return {
    imageUrl,
    revisedPrompt: `[MOCK] ${input.prompt}`,
  };
}

export async function generateImage(
  input: OpenAIImagesGenerateInput
): Promise<OpenAIImageResult> {
  if (process.env.MOCK_IMAGE_GENERATION === "true") {
    return generateMockImage(input);
  }

  const defaultModels: OpenAIImageModel[] = [
    "gpt-image-1",
    "gpt-image-1.5",
    "gpt-image-2",
    "chatgpt-image-latest",
  ];
  const modelsToTry = input.model ? [input.model] : defaultModels;
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const payload: Record<string, unknown> = {
        model,
        prompt: input.prompt,
        n: input.n ?? 1,
      };

      if (model === "dall-e-2" || model === "dall-e-3") {
        payload.size = input.size ?? "1024x1024";
        if (input.quality) payload.quality = normalizeDalleQuality(input.quality);
        if (input.style) payload.style = input.style;
      } else {
        payload.size = input.size ?? "1024x1024";
        payload.output_format = input.outputFormat ?? "png";
        if (input.quality) payload.quality = normalizeGptImageQuality(input.quality);
        if (input.background) payload.background = input.background;
      }

      const response = await retryOnRateLimit(() => getClient().images.generate(payload as unknown as Parameters<OpenAI["images"]["generate"]>[0]));
      if (!("data" in response)) {
        throw new Error("OpenAI image generation returned a stream response unexpectedly.");
      }
      const image = response.data?.[0] as OpenAIImageData | undefined;
      if (!image) {
        throw new Error("OpenAI image generation returned no result.");
      }

      const imageUrl =
        image.url ??
        (image.b64_json ? `data:image/png;base64,${image.b64_json}` : undefined);
      if (!imageUrl) {
        throw new Error("OpenAI image generation returned no usable image URL or base64 data.");
      }

      return {
        imageUrl,
        revisedPrompt: image.revised_prompt,
      };
    } catch (error) {
      if (input.model) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError ?? new Error("OpenAI image generation failed.");
}

export type OpenAIChatInput = {
  messages: Array<{
    content: string;
    role: "system" | "user" | "assistant";
  }>;
  maxTokens?: number;
  model?: string;
  responseFormat?: "json" | "text";
  temperature?: number;
};

export type OpenAIChatResult = {
  content: string;
  model: string;
  finishReason: string;
  usage: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  };
};

export async function generateChatCompletion(
  input: OpenAIChatInput
): Promise<OpenAIChatResult> {
  const model = input.model ?? "gpt-4o-mini";
  const completion = await retryOnRateLimit(() =>
    getClient().chat.completions.create({
      model,
      messages: input.messages.map((msg) => ({
        content: msg.content,
        role: msg.role,
      })),
      max_tokens: input.maxTokens,
      temperature: input.temperature ?? 0.7,
      ...(input.responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
  );

  const choice = completion.choices[0];

  return {
    content: choice?.message?.content ?? "",
    model: completion.model,
    finishReason: choice?.finish_reason ?? "stop",
    usage: {
      completionTokens: completion.usage?.completion_tokens ?? 0,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
    },
  };
}

export async function transcribeAudio(
  audioFile: Blob | File,
  filename?: string
): Promise<string> {
  const file = new File([audioFile], filename ?? "recording.webm", {
    type: audioFile.type || "audio/webm",
  });

  const transcription = await getClient().audio.transcriptions.create({
    model: "whisper-1",
    file,
  });

  return transcription.text ?? "";
}

export function mapAspectRatioToDalleSize(
  aspectRatio?: string
): "1024x1024" | "1792x1024" | "1024x1792" {
  switch (aspectRatio) {
    case "1:1":
      return "1024x1024";
    case "16:9":
      return "1792x1024";
    case "9:16":
      return "1024x1792";
    case "4:3":
      return "1792x1024";
    case "3:4":
      return "1024x1792";
    default:
      return "1024x1024";
  }
}
