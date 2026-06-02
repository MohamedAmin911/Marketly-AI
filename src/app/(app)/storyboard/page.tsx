import type { Metadata } from "next";

import { StoryboardView } from "@/features/storyboard/components/storyboard-view";

export const metadata: Metadata = {
  title: "Storyboard Generator",
};

export default function StoryboardPage() {
  return <StoryboardView />;
}
