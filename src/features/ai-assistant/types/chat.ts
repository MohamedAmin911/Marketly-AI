
export type ChatAttachment = {
  dataUrl: string;
  mimeType: string;
  name: string;
  size: number;
  textContent?: string; // for text/csv files — sent to AI for RAG
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  audio?: string;
  attachment?: ChatAttachment;
  card?: {
    title: string;
    metrics: string[];
  };
};

export type AssistantChatResponse = {
  actions: string[];
  answer: string;
  audio?: string;
  cards: {
    description: string;
    evidence: string;
    severity: "low" | "medium" | "high";
    title: string;
    type: "trend" | "anomaly" | "opportunity" | "risk";
  }[];
  followUps: string[];
  memoryUsed: boolean;
  model: string;
  provider: "openai" | "openrouter";
  recommendations: {
    action: string;
    confidence: number;
    evidence: string;
    priority: "low" | "medium" | "high";
    rationale: string;
    title: string;
  }[];
  response: string;
  sources: {
    content: string;
    id?: string;
    metadata: Record<string, unknown>;
    score: number;
    title?: string;
  }[];
};