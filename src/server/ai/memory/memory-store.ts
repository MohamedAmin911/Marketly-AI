import mongoose from "mongoose";
import { AIMemoryModel, connectToDatabase, type IAIMemory } from "@/server/database";
import { generateEmbedding, retrieveTopK } from "@/server/ai/rag";
import type { AIMemoryRecord, AssistantMemoryDocument, BrandIdentityMemory, ConversationMemory, CreativeMemory } from "@/server/ai/memory/types";
import { createEmptyMemory, normalizeMemory } from "@/server/ai/memory/memory-utils";
export type SaveMemoryInput = {
  brandId?: string;
  content: string;
  metadata?: Record<string, unknown>;
  source?: AssistantMemoryDocument["source"];
  title?: string;
  userId: string;
};
const globalForMemory = globalThis as typeof globalThis & {
  marketlyAIMemoryStore?: Map<string, AIMemoryRecord>;
};

const memoryStore = globalForMemory.marketlyAIMemoryStore ?? new Map<string, AIMemoryRecord>();
globalForMemory.marketlyAIMemoryStore = memoryStore;

export async function readMemoryRecord(userId: string, brandId?: string): Promise<AIMemoryRecord> {
  if (!hasDatabase()) {
    return normalizeMemory(memoryStore.get(memoryKey(userId, brandId)) ?? createSeedMemory(userId, brandId));
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) return createSeedMemory(userId, brandId);

  await connectToDatabase();
  const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
  if (brandId && mongoose.Types.ObjectId.isValid(brandId)) query.brandId = new mongoose.Types.ObjectId(brandId);

  const document = await AIMemoryModel.findOne(query).lean<IAIMemory & { _id: unknown; updatedAt?: Date }>();
  if (!document) return createEmptyMemory(userId, brandId);

  return normalizeMemory(fromDbMemory(document, userId, brandId));
}

export async function writeMemoryRecord(memory: AIMemoryRecord): Promise<AIMemoryRecord> {
  const normalized = normalizeMemory({ ...memory, isMissing: false, lastUpdatedAt: new Date().toISOString() });

  if (!hasDatabase() || !mongoose.Types.ObjectId.isValid(memory.userId)) {
    memoryStore.set(memoryKey(memory.userId, memory.brandId), normalized);
    return normalized;
  }

  await connectToDatabase();
  const filter: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(memory.userId) };
  const updateBrandId = memory.brandId && mongoose.Types.ObjectId.isValid(memory.brandId) ? new mongoose.Types.ObjectId(memory.brandId) : undefined;
  if (updateBrandId) filter.brandId = updateBrandId;

  await AIMemoryModel.updateOne(
    filter,
    {
      $set: {
        averageGenerationType: normalized.averageGenerationType,
        brandIdentity: normalized.brandIdentity,
        documents: normalized.documents,
        mostUsedFeatures: normalized.mostUsedFeatures,
        preferredCaptions: normalized.preferredCaptions,
        preferredHooks: normalized.preferredHooks,
        preferredStyles: normalized.preferredStyles,
        previousConversations: normalized.previousConversations,
        previousRecommendations: normalized.previousRecommendations,
        previousStrategies: normalized.previousStrategies,
        successfulCampaigns: normalized.successfulCampaigns,
        successfulCreatives: normalized.successfulCreatives,
        successfulPrompts: normalized.successfulPrompts,
        userPatterns: normalized.userPatterns,
      },
      $setOnInsert: {
        brandId: updateBrandId,
        userId: new mongoose.Types.ObjectId(memory.userId),
      },
    },
    { upsert: true },
  );

  return normalized;
}

export async function saveMemory(input: SaveMemoryInput): Promise<AssistantMemoryDocument> {
  const content = input.content.trim();
  let embedding: number[] = [];
  try { embedding = await generateEmbedding(content); } catch { /* embeddings unavailable */ }
  const now = new Date().toISOString();
  const document: AssistantMemoryDocument = {
    content,
    createdAt: now,
    embedding,
    id: crypto.randomUUID(),
    metadata: input.metadata ?? {},
    source: input.source ?? "assistant",
    title: input.title,
    updatedAt: now,
  };
  const existing = await readMemoryRecord(input.userId, input.brandId);

  await writeMemoryRecord({
    ...existing,
    documents: [document, ...existing.documents].slice(0, 80),
    isMissing: false,
    lastUpdatedAt: now,
  });

  return document;
}

export async function searchRelevantMemory(input: {
  brandId?: string;
  query: string;
  topK?: number;
  userId: string;
}): Promise<AssistantMemoryDocument[]> {
  const memory = await readMemoryRecord(input.userId, input.brandId);
  if (memory.documents.length === 0) return [];

  let queryEmbedding: number[] = [];
  try { queryEmbedding = await generateEmbedding(input.query); } catch { /* embeddings unavailable */ }
  if (queryEmbedding.length === 0) return [];
  return retrieveTopK(memory.documents, queryEmbedding, input.topK ?? 5);
}

export async function getConversationMemory(input: {
  brandId?: string;
  limit?: number;
  userId: string;
}): Promise<ConversationMemory[]> {
  const memory = await readMemoryRecord(input.userId, input.brandId);
  return memory.previousConversations.slice(0, input.limit ?? 8);
}

function fromDbMemory(document: IAIMemory & { updatedAt?: Date }, userId: string, brandId?: string): AIMemoryRecord {
  return {
    averageGenerationType: document.averageGenerationType,
    brandId,
    brandIdentity: normalizeBrandIdentity(document.brandIdentity),
    conflicts: [],
    documents: normalizeDocuments(((document as unknown as Record<string, unknown>).documents as Array<Record<string, unknown>>) ?? []),
    freshness: "fresh",
    isMissing: false,
    lastUpdatedAt: document.updatedAt?.toISOString(),
    mostUsedFeatures: document.mostUsedFeatures ?? [],
    preferredCaptions: document.preferredCaptions ?? [],
    preferredHooks: document.preferredHooks ?? [],
    preferredStyles: document.preferredStyles ?? [],
    previousConversations: normalizeConversations(document.previousConversations),
    previousRecommendations: document.previousRecommendations ?? [],
    previousStrategies: document.previousStrategies ?? [],
    successfulCampaigns: document.successfulCampaigns ?? [],
    successfulCreatives: normalizeCreatives(document.successfulCreatives ?? document.bestPerformingCreatives),
    successfulPrompts: document.successfulPrompts?.length ? document.successfulPrompts : document.bestPerformingPrompts ?? [],
    userId,
    userPatterns: normalizeMap(document.userPatterns),
    warnings: [],
  };
}

function createSeedMemory(userId: string, brandId?: string): AIMemoryRecord {
  const seeded: AIMemoryRecord = {
    ...createEmptyMemory(userId, brandId),
    brandIdentity: {
      forbiddenWords: ["guaranteed", "risk-free", "best ever"],
      name: "Marketly AI",
      positioning: "AI-powered marketing intelligence for campaign teams",
      tone: "confident, analytical, premium",
      values: ["clarity", "speed", "evidence-led decisions"],
      visualStyle: "dark premium SaaS, clean contrast, precise layouts",
      voice: "strategic, specific, direct",
    },
    documents: [],
    freshness: "fresh",
    isMissing: false,
    lastUpdatedAt: new Date().toISOString(),
    preferredCaptions: ["Clear value first, proof second, action third."],
    preferredHooks: ["Your best campaign is usually hiding in your data."],
    preferredStyles: ["minimalist", "cinematic", "luxury technical"],
    previousRecommendations: ["Test hooks by audience maturity.", "Keep campaign language consistent with brand voice."],
    successfulCampaigns: ["Q3 operations benchmark report"],
    successfulPrompts: ["premium product hero with clean contrast", "platform-native launch campaign with specific audience pain"],
    userPatterns: {
      preferredChannel: "LinkedIn",
      reviewCadence: "weekly",
    },
    warnings: [],
  };

  memoryStore.set(memoryKey(userId, brandId), seeded);
  return seeded;
}

function memoryKey(userId: string, brandId?: string) {
  return `${userId}:${brandId ?? "workspace"}`;
}

function hasDatabase() {
  return Boolean(process.env.MONGODB_URI);
}

function normalizeBrandIdentity(value: Record<string, unknown> | undefined): BrandIdentityMemory {
  return {
    audience: typeof value?.audience === "string" ? value.audience : undefined,
    forbiddenWords: Array.isArray(value?.forbiddenWords) ? value.forbiddenWords.filter((item): item is string => typeof item === "string") : [],
    name: typeof value?.name === "string" ? value.name : undefined,
    positioning: typeof value?.positioning === "string" ? value.positioning : undefined,
    tone: typeof value?.tone === "string" ? value.tone : undefined,
    values: Array.isArray(value?.values) ? value.values.filter((item): item is string => typeof item === "string") : [],
    visualStyle: typeof value?.visualStyle === "string" ? value.visualStyle : undefined,
    voice: typeof value?.voice === "string" ? value.voice : undefined,
  };
}

function normalizeConversations(values: Record<string, unknown>[]): ConversationMemory[] {
  return values.map((value) => ({
    messages: Array.isArray(value.messages)
      ? value.messages
          .filter((message): message is { role: "assistant" | "system" | "user"; text: string } => {
            if (!message || typeof message !== "object") return false;
            const candidate = message as Record<string, unknown>;
            return (candidate.role === "assistant" || candidate.role === "system" || candidate.role === "user") && typeof candidate.text === "string";
          })
          .slice(-12)
      : [],
    summary: typeof value.summary === "string" ? value.summary : undefined,
    topic: typeof value.topic === "string" ? value.topic : undefined,
  }));
}

function normalizeCreatives(values: Record<string, unknown>[]): CreativeMemory[] {
  return values
    .map((value) => ({
      format: typeof value.format === "string" ? value.format : undefined,
      id: typeof value.id === "string" ? value.id : undefined,
      mimeType: typeof value.mimeType === "string" ? value.mimeType : undefined,
      performanceNote: typeof value.performanceNote === "string" ? value.performanceNote : undefined,
      title: typeof value.title === "string" ? value.title : typeof value.alt === "string" ? value.alt : "Successful creative",
      url: typeof value.url === "string" ? value.url : undefined,
    }))
    .filter((creative) => creative.title);
}

function normalizeDocuments(values: Array<Record<string, unknown>>): AssistantMemoryDocument[] {
  return values
    .map((value) => ({
      content: typeof value.content === "string" ? value.content : "",
      createdAt: value.createdAt instanceof Date ? value.createdAt.toISOString() : undefined,
      embedding: Array.isArray(value.embedding) ? value.embedding.filter((item): item is number => typeof item === "number") : [],
      id: typeof value._id === "object" && value._id !== null && "toString" in value._id ? String(value._id) : typeof value.id === "string" ? value.id : undefined,
      metadata: normalizeMap(value.metadata),
      source: parseMemorySource(value.source),
      title: typeof value.title === "string" ? value.title : undefined,
      updatedAt: value.updatedAt instanceof Date ? value.updatedAt.toISOString() : undefined,
    }))
    .filter((document) => document.content && document.embedding.length > 0);
}

function parseMemorySource(value: unknown): AssistantMemoryDocument["source"] {
  if (value === "document" || value === "import" || value === "system") return value;
  return "assistant";
}

function normalizeMap(value: unknown): Record<string, unknown> {
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}