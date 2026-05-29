import type { VideoGenerationRequest, VideoRecord } from "@/features/video-generator/types";
import { apiJson } from "@/lib/api/client";

export async function generateVideo(input: VideoGenerationRequest): Promise<VideoRecord> {
  const formData = new FormData();
  formData.set("productImage", input.productFile);
  formData.set("prompt", input.prompt);
  formData.set("selectedStyle", input.selectedStyle);

  return apiJson<VideoRecord>("/api/video-generator/generate", {
    body: formData,
    headers: { "Idempotency-Key": crypto.randomUUID() },
    method: "POST",
    timeoutMs: 320_000,
  });
}

export async function getVideoHistory(): Promise<VideoRecord[]> {
  const payload = await apiJson<{ items: VideoRecord[] }>("/api/video-generator/history", { timeoutMs: 20_000 });
  return payload.items;
}

export function downloadVideo(video: VideoRecord) {
  if (!video.videoUrl) throw new Error("Video URL is missing.");
  const anchor = document.createElement("a");
  anchor.href = video.videoUrl;
  anchor.download = `${video.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "marketly-video"}.mp4`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
