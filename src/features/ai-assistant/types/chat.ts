export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  card?: {
    title: string;
    metrics: string[];
  };
};

export type AssistantChatResponse = {
  actions: string[];
  answer: string;
  cards: {
    description: string;
    evidence: string;
    severity: "low" | "medium" | "high";
    title: string;
    type: "trend" | "anomaly" | "opportunity" | "risk";
  }[];
  followUps: string[];
  recommendations: {
    action: string;
    confidence: number;
    evidence: string;
    priority: "low" | "medium" | "high";
    rationale: string;
    title: string;
  }[];
};
