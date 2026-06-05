import { apiErrors } from "@/server/errors/api-error";
import type { AIModelRequest, AIModelResponse, HuggingFaceTask } from "@/server/ai/types";
import { createUsage, stringifyMessages, type AIProvider } from "@/server/ai/providers/base-provider";

type HuggingFaceResponse = Array<{ generated_text?: string }> | Blob | Record<string, unknown>;

const defaultModels: Record<HuggingFaceTask, string> = {
  "image-to-video": "stabilityai/stable-video-diffusion-img2vid-xt",
  "text-generation": "mistralai/Mistral-7B-Instruct-v0.3",
  "text-to-image": "stabilityai/stable-diffusion-xl-base-1.0",
  "text-to-video": "ByteDance/AnimateDiff-Lightning",
};

export class HuggingFaceProvider implements AIProvider {
  readonly name = "huggingface" as const;

  constructor(private readonly apiKey = process.env.HUGGINGFACE_API_KEY) {}

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIModelRequest): Promise<AIModelResponse> {
    if (!this.apiKey) throw apiErrors.aiProvider("Hugging Face API key is not configured.");

    const task = request.task ?? inferTask(request);
    const model = request.model ?? defaultModels[task];
    const prompt = stringifyMessages(request);
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      body: JSON.stringify(buildPayload(task, prompt, request)),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: request.abortSignal,
    });

    if (!response.ok) throw apiErrors.aiProvider(`Hugging Face request failed with status ${response.status}.`);

    const contentType = response.headers.get("content-type") ?? "";
    const raw = contentType.includes("application/json") ? ((await response.json()) as HuggingFaceResponse) : await response.blob();
    const text = normalizeHuggingFaceOutput(raw, task);

    return {
      finishReason: "stop",
      model,
      provider: this.name,
      raw,
      text,
      usage: createUsage(prompt, text, 0.0006),
    };
  }
}

function inferTask(request: AIModelRequest): HuggingFaceTask {
  if (request.capability === "video" && request.imageUrl) return "image-to-video";
  if (request.capability === "video") return "text-to-video";
  if (request.capability === "image") return "text-to-image";
  return "text-generation";
}

function buildPayload(task: HuggingFaceTask, prompt: string, request: AIModelRequest) {
  if (task === "image-to-video") {
    return {
      inputs: request.imageUrl ?? prompt,
      parameters: {
        motion_bucket_id: 127,
        noise_aug_strength: 0.02,
      },
    };
  }

  return {
    inputs: prompt,
    parameters: {
      max_new_tokens: request.maxTokens,
      return_full_text: false,
      temperature: request.temperature,
    },
  };
}

function normalizeHuggingFaceOutput(raw: HuggingFaceResponse, task: HuggingFaceTask): string {
  if (raw instanceof Blob) {
    const assetSummary = `${task} asset generated (${raw.type || "application/octet-stream"}, ${raw.size} bytes).`;

    if (task === "text-to-image") {
      return JSON.stringify({
        items: [
          {
            caption: assetSummary,
            cta: "Save generated asset",
            hook: "A provider-generated visual is ready for review.",
            rationale: "The binary output should be persisted to object storage and attached to the generation record.",
            title: "Generated Visual Asset",
          },
        ],
        recommendations: ["Persist the binary result to object storage before returning it to the client."],
        summary: "Image generation completed.",
      });
    }

    return JSON.stringify({
      recommendations: ["Persist the binary video result to object storage and create a thumbnail before client delivery."],
      scenes: [
        {
          effects: ["provider-rendered-motion"],
          sceneImages: [assetSummary],
          transition: "provider-rendered",
          voiceover: undefined,
        },
      ],
      summary: "Video generation completed.",
    });
  }

  if (Array.isArray(raw)) {
    const generatedText = raw.map((item) => item.generated_text).filter(Boolean).join("\n");
    if (generatedText.trim()) return generatedText;
  }

  return JSON.stringify({
    raw,
    recommendations: ["Review provider output mapping for this model."],
    summary: `${task} generation completed.`,
  });
}
