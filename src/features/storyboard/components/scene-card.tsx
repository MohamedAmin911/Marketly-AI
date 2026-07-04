"use client";

import { Check, Copy, Download, Loader2, Quote, X, Film, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import type { CinematicStoryboardScene } from "@/features/storyboard/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function SceneCard({ index, scene, videoPrompt }: { index: number; scene: CinematicStoryboardScene; videoPrompt?: string | null }) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

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

  function copyTitle() {
    navigator.clipboard.writeText(scene.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur transition-all duration-500 animate-in fade-in slide-in-from-bottom-3 hover:-translate-y-1 hover:border-primary/45 hover:shadow-glow">
        <button
          type="button"
          className="relative aspect-video w-full overflow-hidden bg-black cursor-zoom-in block"
          onClick={() => setLightboxOpen(true)}
          aria-label={t("storyboard.openImage")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scene.generatedImage}
            alt={scene.sceneTitle}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
 
        </button>

        <div className="space-y-4 p-5">
          <h3 className="font-display text-xl font-semibold text-white">{scene.sceneTitle}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={copyTitle}
                className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-white/50 hover:text-white"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? t("common.copied") : t("common.copy")}
              </button>

              {videoPrompt ? (
                <Link
                  href={`/videos?prompt=${encodeURIComponent(videoPrompt)}&imageUrl=${encodeURIComponent(scene.generatedImage)}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/30"
                >
                  <Film className="size-3.5" />
                  {t("storyboard.animate")}
                </Link>
              ) : null}
            </div>
            <div className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
              <Quote className="mt-1 size-4 shrink-0 text-primary" />
              <p className="text-sm font-medium leading-6 text-white/86">{scene.script}</p>
            </div>
          </div>
        </div>
      </article>

      {lightboxOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={scene.sceneTitle}
          >
            <div
              className="absolute inset-x-4 top-4 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-5xl rounded-lg overflow-hidden bg-black shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scene.generatedImage}
                  alt={scene.sceneTitle}
                  className="w-2/3 mx-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="absolute start-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/80 backdrop-blur transition hover:bg-white/20"
                  aria-label={t("common.close")}
                >
                  <X className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void downloadFrame()}
                  disabled={isDownloading}
                  className="absolute end-4 top-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-black/50 px-3 text-xs font-semibold text-white/90 backdrop-blur transition hover:border-primary/55 hover:bg-primary/15 disabled:cursor-wait disabled:opacity-70"
                >
                  {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  {t("common.download")}
                </button>
                {videoPrompt ? (
                  <Link
                    href={`/videos?prompt=${encodeURIComponent(videoPrompt)}&imageUrl=${encodeURIComponent(scene.generatedImage)}`}
                    className="absolute end-32 top-4 inline-flex min-h-9 items-center gap-2 rounded-md border border-primary/40 bg-primary/20 px-3 text-xs font-semibold text-primary backdrop-blur transition hover:bg-primary hover:text-black"
                  >
                    <Film className="size-3.5" />
                    {t("storyboard.animate")}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
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
