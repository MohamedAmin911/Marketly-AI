"use client";

import {
  Download,
  Film,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideoRender } from "@/features/video-generator/hooks";
import type { VideoRecord } from "@/features/video-generator/types";
import { cn } from "@/lib/utils";

const stylePresets = [
  "Luxury Commercial",
  "Cinematic",
  "Cyberpunk",
  "Minimal Studio",
  "Dark Luxury",
  "Tech Showcase",
  "Futuristic Ad",
];

export function VideoGeneratorView() {
  const {
    downloadExport,
    downloadVideo,
    error,
    history,
    isHistoryLoading,
    isRendering,
    setVideo,
    startRender,
    video,
  } = useVideoRender();
  const [productFile, setProductFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(stylePresets[0]);
  const [formError, setFormError] = useState("");
  const productPreview = useMemo(
    () => (productFile ? URL.createObjectURL(productFile) : ""),
    [productFile],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlPrompt = params.get("prompt");
      if (urlPrompt) {
        setPrompt(urlPrompt);
      }
    }
  }, []);
  const canGenerate = Boolean(productFile && prompt.trim() && !isRendering);

  async function submitGeneration() {
    if (!productFile) {
      setFormError("Upload a product image before generating.");
      return;
    }
    if (!prompt.trim()) {
      setFormError("Enter a cinematic video prompt.");
      return;
    }

    setFormError("");
    await startRender({ productFile, prompt, selectedStyle });
  }

  return (
    <PageShell
      title="AI Product Video Generator"
      description="Upload a product image and generate a short product video"
      className="max-w-[1480px]"
      actions={
        <Button
          variant="secondary"
          type="button"
          onClick={downloadExport}
          disabled={!video?.videoUrl}
        >
          <Download className="size-4" />
          Download Video
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="glass-panel self-start rounded-lg p-5 sm:p-6">
          <div className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Product Image Upload
            </p>
          </div>

          <label className="group relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-primary/50 bg-black/30 transition hover:border-primary hover:shadow-glow">
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                setProductFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            {productPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productPreview}
                alt="Product preview"
                className="size-full object-cover opacity-90"
              />
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto mb-5 size-12 text-primary" />
                <p className="text-base font-semibold text-white">
                  Upload Product Image
                </p>
                <p className="mt-2 text-sm text-muted">
                  PNG, JPG, WEBP - drag and drop or click
                </p>
              </div>
            )}
          </label>

          <label className="mt-6 block">
            <span className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              <Film className="size-4" />
              Video Prompt
            </span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-40 w-full resize-none rounded-lg border border-primary/15 bg-black/25 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-muted focus:border-primary/60 focus:shadow-[0_0_30px_rgba(114,255,95,0.12)]"
              placeholder="Cinematic luxury product reveal with dramatic lighting&#10;Futuristic cyberpunk camera orbit around the product&#10;Slow-motion premium commercial showcase&#10;Dark studio lighting with floating product particles"
            />
          </label>

          <section className="mt-6">
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              Quick Style Presets
            </p>
            <div className="flex flex-wrap gap-2">
              {stylePresets.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedStyle(style)}
                  className={cn(
                    "rounded-full border border-primary/10 bg-black/25 px-4 py-2 text-xs font-bold text-muted transition hover:border-primary/45 hover:text-white hover:shadow-[0_0_24px_rgba(114,255,95,0.12)]",
                    selectedStyle === style &&
                      "border-primary bg-primary text-[#021003] shadow-glow",
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </section>

          <Button
            className="mt-7 h-13 w-full"
            type="button"
            onClick={() => void submitGeneration()}
            disabled={!canGenerate}
          >
            {isRendering ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isRendering ? "Generating Video" : "Generate Video"}
          </Button>

          {formError || error ? (
            <p className="mt-4 rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
              {formError || error}
            </p>
          ) : null}
        </aside>

        <main className="space-y-6">
          <section className="glass-panel overflow-hidden rounded-lg">
            <div className="relative aspect-video bg-black">
              {isRendering ? (
                <div className="grid size-full place-items-center bg-gradient-to-br from-surface via-black to-surface-container">
                  <div className="text-center">
                    <Loader2 className="mx-auto mb-4 size-12 animate-spin text-primary" />
                    <p className="font-display text-2xl font-semibold text-white">
                      Generating video
                    </p>
                  </div>
                  <div className="absolute inset-0 shimmer opacity-20" />
                </div>
              ) : video?.videoUrl ? (
                <video
                  className="size-full object-contain"
                  controls
                  playsInline
                  poster={video.thumbnailUrl}
                  src={video.videoUrl}
                />
              ) : (
                <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(114,255,95,0.18),transparent_18rem),linear-gradient(135deg,#020902,#061208_48%,#010501)]">
                  <div className="text-center">
                    <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-glow">
                      <Play className="ml-1 size-9" />
                    </div>
                    <h2 className="font-display text-3xl font-semibold text-white">
                      Video preview
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                      Upload a product image, write a prompt, and generate a
                      short product video.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  {video?.title}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {video
                    ? `${video.selectedStyle} - ${formatDate(video.createdAt)}`
                    : ""}
                </p>
              </div>
              <Button
                variant="secondary"
                type="button"
                onClick={downloadExport}
                disabled={!video?.videoUrl}
              >
                <Download className="size-4" />
                Download
              </Button>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  Generated Results Grid
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                  Saved Renders
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {isHistoryLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-64 rounded-lg" />
                  ))
                : null}
              {!isHistoryLoading && history.length === 0 ? (
                <div className="col-span-full grid min-h-44 place-items-center rounded-lg border border-dashed border-primary/20 bg-primary/[0.025] text-center text-sm text-muted">
                  Generated videos will appear here.
                </div>
              ) : null}
              {history.map((item) => (
                <VideoResultCard
                  key={item.id}
                  video={item}
                  onOpen={() => setVideo(item)}
                  onDownload={() => downloadVideo(item)}
                  onRegenerate={() => setVideo(item)}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </PageShell>
  );
}

function VideoResultCard({
  onDownload,
  onOpen,
  onRegenerate,
  video,
}: {
  onDownload: () => void;
  onOpen: () => void;
  onRegenerate: () => void;
  video: VideoRecord;
}) {
  return (
    <article className="group overflow-hidden rounded-lg border border-primary/15 bg-primary/[0.035] transition hover:border-primary/45 hover:shadow-glow">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-video w-full bg-black text-left"
      >
        {video.videoUrl ? (
          <video
            className="size-full object-cover opacity-85 transition group-hover:opacity-100"
            muted
            playsInline
            preload="metadata"
            src={video.videoUrl}
          />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-br from-surface to-surface-container">
            <Film className="size-8 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="line-clamp-1 text-sm font-semibold text-white">
            {video.title}
          </p>
          <p className="mt-1 text-xs text-muted">
            {formatDate(video.createdAt)}
          </p>
        </div>
      </button>
      <div className="space-y-3 p-4">
        <p className="line-clamp-2 text-sm leading-6 text-muted">
          {video.prompt}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onDownload}
            disabled={!video.videoUrl}
          >
            <Download className="size-3" />
            Download
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onRegenerate}
          >
            <RefreshCw className="size-3" />
            View
          </Button>
        </div>
      </div>
    </article>
  );
}

function formatDate(value?: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
