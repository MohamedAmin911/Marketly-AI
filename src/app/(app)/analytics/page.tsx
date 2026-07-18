import type { Metadata } from "next";

import { AnalyticsView } from "@/features/analytics/components/analytics-view";
import { FeatureGuard } from "@/components/layout/feature-guard";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <FeatureGuard featureName="analytics">
      <AnalyticsView />
    </FeatureGuard>
  );
}
