"use client";

import { Aperture, Download, LampDesk, Loader2, Quote, Video } from "lucide-react";
import { useState } from "react";

import type { CinematicStoryboardScene } from "@/features/storyboard/types";

export function SceneCard({ index, scene }: { index: number; scene: CinematicStoryboardScene }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const cameraAngle = extractCameraAngle(scene.imagePrompt);
  const lighting = extractLighting(scene.imagePrompt);

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
    <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-[var(--panel-shadow)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/45">
      <div className="relative aspect-video overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scene.generatedImage} alt={scene.sceneTitle} className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/30" />
        <span className="absolute left-4 top-4 rounded-md border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold uppercase text-white backdrop-blur">
          Frame {String(index + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => void downloadFrame()}
          disabled={isDownloading}
          className="absolute right-4 top-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-white/15 bg-black/50 px-3 text-xs font-semibold text-white backdrop-blur transition hover:border-primary/55 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-wait disabled:opacity-70"
        >
          {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Download
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Frame {String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-foreground">{scene.sceneTitle}</h3>
        </div>

        <ProductionNote icon={Video} label="Scene Description" value={scene.imagePrompt || scene.sceneTitle} />

        <div className="grid gap-3 sm:grid-cols-2">
          <ProductionNote icon={Aperture} label="Camera Angle" value={cameraAngle} compact />
          <ProductionNote icon={LampDesk} label="Lighting" value={lighting} compact />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase text-muted">Voice Over</span>
          <div className="flex gap-3 rounded-lg border border-border bg-surface p-4">
            <Quote className="mt-1 size-4 shrink-0 text-primary" />
            <p className="text-sm font-medium leading-6 text-foreground">{scene.script}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductionNote({
  compact = false,
  icon: Icon,
  label,
  value,
}: {
  compact?: boolean;
  icon: typeof Video;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <p className={compact ? "text-xs leading-5 text-foreground" : "text-sm leading-6 text-muted"}>{value}</p>
    </div>
  );
}

function extractCameraAngle(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("close-up") || lower.includes("close up")) return "Close-up product hero shot";
  if (lower.includes("wide")) return "Wide establishing commercial frame";
  if (lower.includes("low angle")) return "Low-angle premium hero perspective";
  if (lower.includes("overhead") || lower.includes("top-down")) return "Overhead product composition";
  if (lower.includes("macro")) return "Macro detail shot";
  return "Cinematic product-focused angle";
}

function extractLighting(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("golden")) return "Warm golden-hour lighting";
  if (lower.includes("neon")) return "High-contrast neon accent lighting";
  if (lower.includes("soft")) return "Soft diffused studio lighting";
  if (lower.includes("dramatic")) return "Dramatic contrast with shaped shadows";
  if (lower.includes("natural")) return "Natural commercial lighting";
  return "Premium controlled commercial lighting";
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "cinematic-frame";
}

function getExtension(mimeType: string): string {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}
