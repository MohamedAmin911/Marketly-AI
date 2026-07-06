import {
  generateImage as openaiGenerateImage,
  generateChatCompletion as openaiGenerateChatCompletion,
  transcribeAudio as openaiTranscribeAudio,
} from "@/lib/services/openai-service";
import type { OpenAIImagesGenerateInput } from "@/lib/services/openai-service";
import type {
  AIProvider,
  AIProviderName,
  AIImageInput,
  AIImageResult,
  AIChatInput,
  AIChatResult,
} from "@/lib/services/ai-provider";

const PROVIDER_NAME: AIProviderName = "openai";

function adaptImageInput(input: AIImageInput): OpenAIImagesGenerateInput {
  let prompt = input.prompt;

  if (input.productImage || input.referenceImage) {
    const parts: string[] = [prompt];
    if (input.productImage) {
      parts.push(`Product image URL: ${input.productImage}`);
    }
    if (input.referenceImage) {
      parts.push(`Reference image URL: ${input.referenceImage}`);
    }
    prompt = parts.join("\n\n");
  }

  return {
    prompt,
    ...(input.model ? { model: input.model as OpenAIImagesGenerateInput["model"] } : {}),
    ...(input.n ? { n: input.n } : {}),
    ...(input.quality ? { quality: input.quality as OpenAIImagesGenerateInput["quality"] } : {}),
    ...(input.size ? { size: input.size } : {}),
    ...(input.style ? { style: input.style } : {}),
    ...(input.outputFormat ? { outputFormat: input.outputFormat } : {}),
    ...(input.background ? { background: input.background } : {}),
  };
}

export const openAIProvider: AIProvider = {
  name: PROVIDER_NAME,

  async generateImage(input: AIImageInput): Promise<AIImageResult> {
    return openaiGenerateImage(adaptImageInput(input));
  },

  async generateChatCompletion(input: AIChatInput): Promise<AIChatResult> {
    return openaiGenerateChatCompletion({
      messages: input.messages,
      model: input.model,
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      responseFormat: input.responseFormat,
    });
  },

  async transcribeAudio(
    audioFile: Blob | File,
    filename?: string
  ): Promise<string> {
    return openaiTranscribeAudio(audioFile, filename);
  },

  isAvailable(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  },
};
