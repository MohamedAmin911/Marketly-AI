import { Metadata } from "next";
import { ViralEngineView } from "@/features/viral-engine/components/viral-engine-view";
import { FeatureGuard } from "@/components/layout/feature-guard";

export const metadata: Metadata = {
  title: "Viral Engine",
  description: "Discover trending content, competitors, viral hooks and content opportunities powered by AI.",
};

export default function ViralEnginePage() {
  return (
    <FeatureGuard featureName="viralEngine">
      <ViralEngineView />
    </FeatureGuard>
  );
}
