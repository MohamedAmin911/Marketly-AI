import type { Metadata } from "next";

import { GrowthEngineView } from "@/features/growth-engine/components/growth-engine-view";

export const metadata: Metadata = {
  title: "AI Growth Engine",
};

export default function GrowthEnginePage() {
  return <GrowthEngineView />;
}
