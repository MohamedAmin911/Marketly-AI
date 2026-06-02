import type { Metadata } from "next";

import { CampaignGeneratorView } from "@/features/campaign-generator/components/campaign-generator-view";

export const metadata: Metadata = {
  title: "Campaign Generator",
};

export default function CampaignGeneratorPage() {
  return <CampaignGeneratorView />;
}
