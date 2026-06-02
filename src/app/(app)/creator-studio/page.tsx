import type { Metadata } from "next";

import { CreatorStudioView } from "@/features/creator-studio/components/creator-studio-view";

export const metadata: Metadata = {
  title: "AI Product Advertisement Studio",
};

export default function CreatorStudioPage() {
  return <CreatorStudioView />;
}
