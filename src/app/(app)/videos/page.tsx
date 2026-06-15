import type { Metadata } from "next";

import { VideoGeneratorView } from "@/features/video-generator/components/video-generator-view";

export const metadata: Metadata = {
  title: "Video Generation",
};

export default function VideoGenerationPage() {
  return <VideoGeneratorView />;
}
