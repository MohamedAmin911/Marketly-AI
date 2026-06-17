export type AIProviderName = "openai" | "huggingface";

export type AIImageInput = {
  prompt: string;
  model?: string;
  n?: number;
  quality?: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  style?: "vivid" | "natural";
  outputFormat?: "png" | "jpeg" | "webp";
  background?: "transparent" | "opaque" | "auto";
  productImage?: File | Blob | string;
  referenceImage?: File | Blob | string;
};

export type AIImageResult = {
  imageUrl: string;
  revisedPrompt?: string;
  seed?: number;
  rawResult?: unknown;
};

export type AIChatMessage = {
  content: string;
  role: "system" | "user" | "assistant";
};

export type AIChatInput = {
  messages: AIChatMessage[];
  maxTokens?: number;
  model?: string;
  responseFormat?: "json" | "text";
  temperature?: number;
};

export type AIChatResult = {
  content: string;
  model: string;
  finishReason: string;
  usage: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  };
};

export interface AIProvider {
  readonly name: AIProviderName;
  generateImage(input: AIImageInput): Promise<AIImageResult>;
  generateChatCompletion(input: AIChatInput): Promise<AIChatResult>;
  transcribeAudio(audioFile: Blob | File, filename?: string): Promise<string>;
  isAvailable(): boolean;
}
