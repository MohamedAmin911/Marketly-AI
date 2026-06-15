"use client";

import { Download, Loader2, Quote } from "lucide-react";
import { useState } from "react";

import type { CinematicStoryboardScene } from "@/features/storyboard/types";

export function SceneCard({ index, scene }: { index: number; scene: CinematicStoryboardScene }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadFrame() {
    try {
      setIsDownloading(true);
      const response = await fetch(scene.generatedImage);
      if (!response.ok) throw new Error("Could not download storyboard frame.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `storyboard-frame-${String(index + 1).padStart(2, "0")}-${slugify(scene.sceneTitle)}.${getExtension(blob.type)}`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(scene.generatedImage, "_blank", "noopener,noreferrer");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur transition-all duration-500 animate-in fade-in slide-in-from-bottom-3 hover:-translate-y-1 hover:border-primary/45 hover:shadow-glow">
      <div className="relative aspect-video overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scene.generatedImage} alt={scene.sceneTitle} className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/35" />
        <span className="absolute left-4 top-4 rounded-md border border-white/10 bg-black/45 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 backdrop-blur">
          Frame {String(index + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => void downloadFrame()}
          disabled={isDownloading}
          className="absolute right-4 top-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-black/50 px-3 text-xs font-semibold text-white/90 backdrop-blur transition hover:border-primary/55 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow disabled:cursor-wait disabled:opacity-70"
        >
          {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Download
        </button>
      </div>

      <div className="space-y-4 p-5">
        <h3 className="font-display text-xl font-semibold text-white">{scene.sceneTitle}</h3>
        
        {scene.imagePrompt && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Image Prompt</span>
            <p className="text-sm font-medium leading-relaxed text-white/70">{scene.imagePrompt}</p>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Voice Over</span>
          <div className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
            <Quote className="mt-1 size-4 shrink-0 text-primary" />
            <p className="text-sm font-medium leading-6 text-white/86">{scene.script}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "cinematic-frame";
}

function getExtension(mimeType: string): string {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}
