import { Client } from "@gradio/client";
import { HfInference } from "@huggingface/inference";
import { generateFluxImage } from "@/lib/services/providers/gradio-image-provider";
import type {
  AIProvider,
  AIProviderName,
  AIImageInput,
  AIImageResult,
  AIChatInput,
  AIChatResult,
} from "@/lib/services/ai-provider";

const PROVIDER_NAME: AIProviderName = "huggingface";

const HF_TEXT_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";
const HF_TEXT_GENERATION_SPACE = "huggingface-projects/llama-2-7b-chat";
const HF_ASR_MODEL = "openai/whisper-large-v3";

let hfClient: HfInference | null = null;

function getClient(): HfInference {
  if (!hfClient) {
    const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
    if (!token) {
      throw new Error(
        "HF_TOKEN or HUGGINGFACE_API_KEY is not configured. Add it to .env.local to use Hugging Face AI generation features."
      );
    }
    hfClient = new HfInference(token);
  }
  return hfClient;
}

function isHfToken(token?: string): token is `hf_${string}` {
  return Boolean(token?.startsWith("hf_"));
}

async function generateGradioText(
  promptText: string,
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  try {
    const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
    const client = await Client.connect(
      HF_TEXT_GENERATION_SPACE,
      isHfToken(token) ? { token } : undefined,
    );

    const result = await client.predict("/generate", {
      message: promptText,
      system_prompt: "",
      max_new_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      top_p: 0.9,
      top_k: 50,
      repetition_penalty: 1.2,
    });

    const data = Array.isArray(result.data) ? result.data : [result.data];
    return String(data[0] ?? "").trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : (typeof err === "object" && err !== null ? JSON.stringify(err) : String(err));
    throw new Error(`HuggingFace Text Generation Error: ${msg}`);
  }
}

export const huggingFaceProvider: AIProvider = {
  name: PROVIDER_NAME,

  async generateImage(input: AIImageInput): Promise<AIImageResult> {
    return generateFluxImage(input);
  },

  async generateChatCompletion(input: AIChatInput): Promise<AIChatResult> {
    const model = input.model && input.model.includes("/") ? input.model : HF_TEXT_MODEL;
    const promptText = input.messages
      .map((msg) => {
        const prefix =
          msg.role === "system"
            ? "System:"
            : msg.role === "assistant"
              ? "Assistant:"
              : "User:";
        return `${prefix} ${msg.content}`;
      })
      .join("\n\n");

    const content = await generateGradioText(promptText, {
      maxTokens: input.maxTokens ?? 1024,
      temperature: input.temperature ?? 0.7,
    });

    return {
      content,
      model,
      finishReason: "stop",
      usage: {
        completionTokens: 0,
        promptTokens: 0,
        totalTokens: 0,
      },
    };
  },

  async transcribeAudio(
    audioFile: Blob | File,
    filename?: string
  ): Promise<string> {
    const result = await getClient().automaticSpeechRecognition({
      model: HF_ASR_MODEL,
      data: audioFile,
    });

    return result.text ?? "";
  },

  isAvailable(): boolean {
    return Boolean(
      process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY
    );
  },
};
