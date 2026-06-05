import type { Metadata } from "next";

import { AiAssistantView } from "@/features/ai-assistant/components/ai-assistant-view";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default function AiAssistantPage() {
  return <AiAssistantView />;
}
