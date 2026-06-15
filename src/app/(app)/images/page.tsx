import type { Metadata } from "next";

import { StoryboardView } from "@/features/storyboard/components/storyboard-view";

export const metadata: Metadata = {
  title: "Image Generation",
};

export default function ImageGenerationPage() {
  return <StoryboardView />;
}
