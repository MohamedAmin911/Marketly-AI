import type { Metadata } from "next";

import { AiAssistantView } from "@/features/ai-assistant/components/ai-assistant-view";
import { FeatureGuard } from "@/components/layout/feature-guard";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default function AiAssistantPage() {
  return (
    <FeatureGuard featureName="aiAssistant">
      <AiAssistantView />
    </FeatureGuard>
  );
}
