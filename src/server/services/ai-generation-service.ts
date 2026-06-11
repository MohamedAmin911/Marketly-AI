
  import { runAIWorkflow } from "@/server/ai";
import { retrieveAIMemory } from "@/server/ai/memory/retrieval-service";
import { getConversationMemory, saveMemory, searchRelevantMemory } from "@/server/ai/memory/memory-store";
import { updateAIMemory } from "@/server/ai/memory/update-service";
import type { AIWorkflowName } from "@/server/ai/types";
import { env } from "@/server/config/env";
import { ApiError, apiErrors } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";
import type { AuthContext } from "@/server/security/auth-guard";
import type { AiGenerationRequest, AssistantChatRequest } from "@/server/schemas/ai";

type ChatRole = "assistant" | "system" | "user";

type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
type ChatMessage = {
  content: string | ContentPart[];
  role: ChatRole;
};

type ChatProviderResult = {
  model: string;
  provider: "openai" | "openrouter";
  text: string;
};

type ChatCompletionPayload = {
  choices?: Array<{ message?: { content?: unknown } }>;
  error?: { message?: string };
  model?: string;
};

export type AIResponseSource = {
  content: string;
  id?: string;
  metadata: Record<string, unknown>;
  score: number;
  title?: string;
};

export type AIResponseResult = {
  actions: string[];
  answer: string;
  cards: [];
  followUps: string[];
  memoryUsed: boolean;
  model: string;
  provider: "openai" | "openrouter";
  recommendations: [];
  response: string;
  sources: AIResponseSource[];
};

export async function generateAiAsset(input: AiGenerationRequest, auth: AuthContext) {
  return runAIWorkflow(
    {
      brandId: input.brandId,
      context: {
        ...input.context,
        capability: input.capability,
        imageUrl: input.imageUrl,
        task: input.task,
      },
      model: input.model,
      prompt: input.prompt,
      template: input.template,
      temperature: input.temperature,
      workflow: input.workflow ?? workflowFromMode(input.mode),
    },
    auth,
    input.provider,
  );
}

async function synthesizeAudio(text: string): Promise<string | null> {
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenKey) return null;
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
    if (!res.ok) { console.error("ElevenLabs TTS failed", res.status, await res.text()); return null; }
    const buf = await res.arrayBuffer();
    return `data:audio/mpeg;base64,${Buffer.from(buf).toString("base64")}`;
  } catch { return null; }
}

export async function generateAIResponse(input: AssistantChatRequest, auth: AuthContext): Promise<AIResponseResult> {
  const userId = auth.user.sub;
  const brandId = input.brandId;
  const profileMemory = await retrieveAIMemory(userId, brandId);
  const conversationMemory = await getConversationMemory({ brandId, limit: 8, userId });
  const retrievedMemory = await safelySearchMemory({
    brandId,
    query: input.message,
    userId,
  });
  const messages = buildAssistantMessages(input, {
    conversationMemory,
    profileMemory,
    retrievedMemory,
  });
  const generation = await callAssistantModel(messages, {
    model: input.model,
    temperature: input.temperature,
  });
  const response = generation.text.trim();

  if (!response) throw apiErrors.aiProvider("The AI provider returned an empty assistant response.");

  await persistAssistantExchange({
    answer: response,
    brandId,
    message: input.message,
    model: generation.model,
    provider: generation.provider,
    sources: retrievedMemory.map((memory) => memory.id).filter((id): id is string => Boolean(id)),
    userId,
  });

  const audio = input.wantAudio ? await synthesizeAudio(response) : null;

  return {
    actions: [],
    answer: response,
    audio: audio ?? undefined,
    cards: [],
    followUps: [],
    memoryUsed: retrievedMemory.length > 0,
    model: generation.model,
    provider: generation.provider,
    recommendations: [],
    response,
    sources: retrievedMemory.map((memory) => ({
      content: memory.content,
      id: memory.id,
      metadata: memory.metadata,
      score: memory.score ?? 0,
      title: memory.title,
    })),
  };
}

function workflowFromMode(mode: AiGenerationRequest["mode"]): AIWorkflowName {
  const map = {
    campaign: "campaign-generation",
    image: "creator-studio",
    strategy: "analytics-recommendations",
    video: "video-generation",
  } satisfies Record<AiGenerationRequest["mode"], AIWorkflowName>;

  return map[mode];
}

function buildAssistantMessages(
  input: AssistantChatRequest,
  context: {
    conversationMemory: Awaited<ReturnType<typeof getConversationMemory>>;
    profileMemory: Awaited<ReturnType<typeof retrieveAIMemory>>;
    retrievedMemory: Awaited<ReturnType<typeof searchRelevantMemory>>;
  },
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      content: [
        "You are Marketly AI, a senior marketing strategy assistant.",
        "Answer conversationally and be specific, practical, and evidence-led.",
        "Use retrieved memory and conversation history when relevant.",
        "Do not invent campaign facts. If context is missing, say what is missing and give the best next step.",
        "Never mention your communication medium (voice, text, chat). Just answer the question directly.",
        "If the user attaches a file, read the file contents provided and answer based on them.",
      ].join(" "),
      role: "system",
    },
    {
      content: buildContextBlock(input, context.profileMemory, context.retrievedMemory),
      role: "system",
    },
  ];

  for (const conversation of [...context.conversationMemory].reverse()) {
    for (const message of conversation.messages.slice(-6)) {
      messages.push({
        content: message.text,
        role: message.role,
      });
    }
  }

  if (input.imageData) {
    messages.push({
      role: "user",
      content: [
        { type: "text" as const, text: input.message },
        { type: "image_url" as const, image_url: { url: input.imageData } },
      ],
    });
  } else {
    messages.push({ content: input.message, role: "user" });
  }
  return messages;
}

function buildContextBlock(
  input: AssistantChatRequest,
  profileMemory: Awaited<ReturnType<typeof retrieveAIMemory>>,
  retrievedMemory: Awaited<ReturnType<typeof searchRelevantMemory>>,
): string {
  const sections = [
    "Workspace context:",
    `Brand: ${input.brand.name} (${input.brand.industry})`,
    `Audience: ${input.brand.audience}`,
    `Offer: ${input.brand.offer}`,
    `Tone: ${input.brand.tone}`,
    `Goals: ${input.brand.goals.join(", ") || "not provided"}`,
    "",
    "Persisted profile:",
    `Brand voice: ${profileMemory.brandIdentity.voice ?? profileMemory.brandIdentity.tone ?? "not recorded"}`,
    `Positioning: ${profileMemory.brandIdentity.positioning ?? "not recorded"}`,
    `Preferred hooks: ${profileMemory.preferredHooks.join("; ") || "not recorded"}`,
    `Preferred styles: ${profileMemory.preferredStyles.join("; ") || "not recorded"}`,
    `Successful campaigns: ${profileMemory.successfulCampaigns.join("; ") || "not recorded"}`,
    `Prior recommendations: ${profileMemory.previousRecommendations.slice(0, 6).join("; ") || "not recorded"}`,
    "",
    "Request memory:",
    formatRetrievedMemory(retrievedMemory),
    "",
    "Analytics context:",
    formatAnalytics(input.analytics),
  ];

  return sections.join("\n");
}

function formatRetrievedMemory(retrievedMemory: Awaited<ReturnType<typeof searchRelevantMemory>>): string {
  if (retrievedMemory.length === 0) return "No semantically relevant stored memories were found.";

  return retrievedMemory
    .map((memory, index) => {
      const label = memory.title ? `${index + 1}. ${memory.title}` : `${index + 1}. Memory`;
      const score = typeof memory.score === "number" ? ` (similarity ${memory.score.toFixed(3)})` : "";
      return `${label}${score}\n${memory.content}`;
    })
    .join("\n\n");
}

function formatAnalytics(analytics: AssistantChatRequest["analytics"]): string {
  if (analytics.length === 0) return "No analytics rows were provided.";

  return analytics
    .slice(0, 8)
    .map((point) => {
      const metrics = [
        `impressions ${point.impressions}`,
        `clicks ${point.clicks}`,
        `conversions ${point.conversions}`,
        point.ctr === undefined ? undefined : `CTR ${point.ctr}%`,
        point.roi === undefined ? undefined : `ROI ${point.roi}%`,
        point.spend === undefined ? undefined : `spend ${point.spend}`,
      ].filter(Boolean);
      return `${point.campaignName} (${point.period}): ${metrics.join(", ")}. Trends: ${point.trends.join("; ") || "none"}. Recommendations: ${point.recommendations.join("; ") || "none"}.`;
    })
    .join("\n");
}

async function safelySearchMemory(input: { brandId?: string; query: string; userId: string }) {
  try {
    return await searchRelevantMemory({ ...input, topK: 5 });
  } catch (error) {
    logger.warn("ai.assistant.memory_search_failed", {
      errorMessage: error instanceof Error ? error.message : String(error),
      userId: input.userId,
    });
    return [];
  }
}

async function callAssistantModel(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature: number;
  },
): Promise<ChatProviderResult> {
  const failures: string[] = [];

  if (env.OPENROUTER_API_KEY) {
    try {
      return await requestOpenRouterChat(messages, options);
    } catch (error) {
      if (!env.OPENAI_API_KEY && error instanceof ApiError && error.code === "RATE_LIMITED") throw error;
      failures.push(error instanceof Error ? error.message : String(error));
      logger.warn("ai.assistant.openrouter_failed", { errorMessage: failures.at(-1) });
    }
  }

  if (env.OPENAI_API_KEY) {
    try {
      return await requestOpenAIChat(messages, options);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
      if (error instanceof ApiError) throw error;
      throw apiErrors.aiProvider("OpenAI assistant generation failed.", error);
    }
  }

  if (failures.length > 0) {
    throw apiErrors.aiProvider(`AI assistant generation failed. ${failures.join(" ")}`);
  }

  throw apiErrors.aiProvider("Configure OPENROUTER_API_KEY or OPENAI_API_KEY to use the AI assistant.");
}

async function requestOpenRouterChat(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature: number;
  },
): Promise<ChatProviderResult> {
  const model = normalizeOpenRouterModel(options.model ?? "openai/gpt-4o-mini");
  const payload = await requestChatCompletion({
    apiKey: env.OPENROUTER_API_KEY,
    body: {
      max_tokens: 1200,
      messages,
      model,
      temperature: options.temperature,
    },
    provider: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
  });

  return {
    model: payload.model ?? model,
    provider: "openrouter",
    text: extractAssistantText(payload, "OpenRouter"),
  };
}

async function requestOpenAIChat(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature: number;
  },
): Promise<ChatProviderResult> {
  const model = normalizeOpenAIModel(options.model ?? "gpt-4o-mini");
  const payload = await requestChatCompletion({
    apiKey: env.OPENAI_API_KEY,
    body: {
      max_tokens: 1200,
      messages,
      model,
      temperature: options.temperature,
    },
    provider: "openai",
    url: "https://api.openai.com/v1/chat/completions",
  });

  return {
    model: payload.model ?? model,
    provider: "openai",
    text: extractAssistantText(payload, "OpenAI"),
  };
}

async function requestChatCompletion(input: {
  apiKey?: string;
  body: Record<string, unknown>;
  provider: "openai" | "openrouter";
  url: string;
}): Promise<ChatCompletionPayload> {
  if (!input.apiKey) throw apiErrors.aiProvider(`${input.provider} API key is not configured.`);

  try {
    const response = await fetch(input.url, {
      body: JSON.stringify(input.body),
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        ...(input.provider === "openrouter"
          ? {
              "HTTP-Referer": "https://marketly.ai",
              "X-Title": "Marketly AI",
            }
          : {}),
      },
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as ChatCompletionPayload | null;

    if (!response.ok) {
      if (response.status === 429) throw apiErrors.rateLimited(60);
      throw apiErrors.aiProvider(payload?.error?.message ?? `${input.provider} chat request failed with status ${response.status}.`);
    }

    if (!payload) throw apiErrors.aiProvider(`${input.provider} returned an empty chat payload.`);
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw apiErrors.aiProvider(`${input.provider} chat request failed.`, error);
  }
}

function extractAssistantText(payload: ChatCompletionPayload, provider: "OpenAI" | "OpenRouter"): string {
  const content = payload.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    const text = content
      .filter((block): block is { type: string; text: string } => typeof block === "object" && block !== null && "text" in block)
      .map((block) => block.text)
      .join("");
    if (text.trim()) return text;
  }
  if (typeof content === "string" && content.trim()) return content;
  throw apiErrors.aiProvider(`${provider} returned an invalid assistant message.`);
}

async function persistAssistantExchange(input: {
  answer: string;
  brandId?: string;
  message: string;
  model: string;
  provider: string;
  sources: string[];
  userId: string;
}) {
  const content = `User: ${input.message}\nAssistant: ${input.answer}`;

  try {
    await updateAIMemory({
      brandId: input.brandId,
      mostUsedFeatures: ["ai-assistant"],
      previousConversations: [
        {
          messages: [
            { role: "user", text: input.message.slice(0, 4000) },
            { role: "assistant", text: input.answer.slice(0, 4000) },
          ],
          summary: input.answer.slice(0, 1000),
          topic: input.message.slice(0, 180),
        },
      ],
      userId: input.userId,
      userPatterns: {
        lastAssistantModel: input.model,
        lastAssistantProvider: input.provider,
        lastAssistantUsedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.warn("ai.assistant.conversation_persist_failed", {
      errorMessage: error instanceof Error ? error.message : String(error),
      userId: input.userId,
    });
  }

  try {
    await saveMemory({
      brandId: input.brandId,
      content,
      metadata: {
        model: input.model,
        provider: input.provider,
        sourceIds: input.sources,
        type: "conversation",
      },
      source: "assistant",
      title: input.message.slice(0, 120),
      userId: input.userId,
    });
  } catch (error) {
    logger.warn("ai.assistant.memory_persist_failed", {
      errorMessage: error instanceof Error ? error.message : String(error),
      userId: input.userId,
    });
  }
}

function normalizeOpenRouterModel(model: string): string {
  return model.includes("/") ? model : `openai/${model}`;
}

function normalizeOpenAIModel(model: string): string {
  return model.includes("/") ? model.split("/").at(-1) ?? "gpt-4o-mini" : model;
}