import type { Metadata } from "next";

import { VideoGeneratorView } from "@/features/video-generator/components/video-generator-view";

export const metadata: Metadata = {
  title: "Video Generator",
};

export default function VideoGeneratorPage() {
  return <VideoGeneratorView />;
}
