import type { Metadata } from "next";

import { GrowthEngineView } from "@/features/growth-engine/components/growth-engine-view";
import { FeatureGuard } from "@/components/layout/feature-guard";

export const metadata: Metadata = {
  title: "AI Growth Engine",
};

export default function GrowthEnginePage() {
  return (
    <FeatureGuard featureName="growthEngine">
      <GrowthEngineView />
    </FeatureGuard>
  );
}
