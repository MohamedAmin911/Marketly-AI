import type { Metadata } from "next";

import { MarketingStrategyView } from "@/features/marketing-strategy/components/marketing-strategy-view";

export const metadata: Metadata = {
  title: "Marketing Strategy",
};

export default function MarketingStrategyPage() {
  return <MarketingStrategyView />;
}
