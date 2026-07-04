"use client";

import {
  Download,
  Film,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  UploadCloud,
  Monitor,
  RectangleVertical,
  WandSparkles,
  ImagePlus,
  Clock3,
  Frame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useVideoRender } from "@/features/video-generator/hooks";
import type { VideoRecord } from "@/features/video-generator/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
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

const durationOptions = ["5s", "10s", "15s"] as const;
const aspectOptions = [
  { label: "16:9", icon: Monitor, description: "Landscape" },
  { label: "9:16", icon: RectangleVertical, description: "Vertical" },
] as const;

type DurationOption = (typeof durationOptions)[number];
type AspectOption = (typeof aspectOptions)[number]["label"];

export function VideoGeneratorView() {
  const { t } = useTranslation();
  const { downloadExport, downloadVideo, error, history, isHistoryLoading, isRendering, setVideo, startRender, video } = useVideoRender();
  const [productFile, setProductFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(stylePresets[0]);
  const [duration, setDuration] = useState<DurationOption>("10s");
  const [aspectRatio, setAspectRatio] = useState<AspectOption>("16:9");
  const [formError, setFormError] = useState("");
  const productPreview = useMemo(
    () => (productFile ? URL.createObjectURL(productFile) : ""),
    [productFile],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlPrompt = params.get("prompt");
      const urlImage = params.get("imageUrl");

      if (urlPrompt) {
        setPrompt(urlPrompt);
      }

      if (urlImage) {
        fetch(urlImage)
          .then((res) => res.blob())
          .then((blob) => {
            let ext = "png";
            if (blob.type === "image/jpeg") ext = "jpg";
            else if (blob.type === "image/webp") ext = "webp";
            
            const file = new File([blob], `generated-scene.${ext}`, { type: blob.type });
            setProductFile(file);
          })
          .catch((err) => console.error("Failed to load image from URL:", err));
      }
    }
  }, []);
  const canGenerate = Boolean(productFile && prompt.trim() && !isRendering);

  const finalPrompt = useMemo(() => {
    const trimmedPrompt = prompt.trim();
    return `${trimmedPrompt}\n\nVideo Direction:\nStyle preset: ${selectedStyle}.\nDuration: ${duration}.\nAspect ratio: ${aspectRatio}.\nKeep the product prominent, preserve brand details, use smooth commercial camera movement, and finish with a polished product hero frame.`;
  }, [aspectRatio, duration, prompt, selectedStyle]);

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
    await startRender({ productFile, prompt: finalPrompt, selectedStyle });
  }

  return (
    <PageShell
      title={t("video.title")}
      description={t("video.description")}
      className="max-w-[1480px]"
      actions={
        <Button variant="secondary" type="button" onClick={downloadExport} disabled={!video?.videoUrl}>
          <Download className="size-4" />
          {t("video.downloadVideo")}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="self-start rounded-lg border border-border bg-card p-5 shadow-[var(--panel-shadow)] sm:p-6 xl:sticky xl:top-24">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Film className="size-5" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold text-foreground">{t("video.renderInputs")}</p>
                <p className="text-xs text-muted">{t("video.renderInputsDesc")}</p>
              </div>
            </div>

            <div className="space-y-5">
              <PanelSection title={t("storyboard.productUpload")} icon={UploadCloud}>
                <ProductUpload productFile={productFile} previewUrl={productPreview} onSelect={setProductFile} />
              </PanelSection>

              <PanelSection title={t("video.prompt")} icon={WandSparkles}>
                <FormField label={t("video.videoPrompt")} id="video-generator-prompt">
                  <Textarea
                    id="video-generator-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="min-h-36 resize-none"
                    placeholder={t("video.promptPlaceholder")}
                  />
                </FormField>
              </PanelSection>

              <PanelSection title={t("video.stylePresets")} icon={Sparkles}>
                <div className="grid grid-cols-2 gap-2">
                  {stylePresets.map((style) => (
                    <Button
                      key={style}
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedStyle(style)}
                      className={cn("h-auto justify-start px-3 py-2 text-start text-xs", selectedStyle === style && "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_3px_var(--focus-ring)]")}
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </PanelSection>

              {/* <PanelSection title="Duration" icon={Clock3}>
                <SegmentedOptions value={duration} options={durationOptions} onChange={setDuration} />
              </PanelSection> */}

              <PanelSection title={t("video.aspectRatio")} icon={Frame}>
                <div className="grid grid-cols-2 gap-2">
                  {aspectOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = aspectRatio === option.label;

                    return (
                      <Button
                        key={option.label}
                        type="button"
                        variant="secondary"
                        onClick={() => setAspectRatio(option.label)}
                        className={cn("h-auto justify-start px-3 py-3 text-start", selected && "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_3px_var(--focus-ring)]")}
                      >
                        <Icon className="size-5 shrink-0 text-primary" />
                        <span>
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="block text-xs text-muted">{option.description}</span>
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </PanelSection>

              <Button className="h-12 w-full" type="button" onClick={() => void submitGeneration()} disabled={!canGenerate}>
                {isRendering ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {isRendering ? t("video.generatingVideo") : t("video.generateVideo")}
              </Button>

              {formError || error ? <p className="rounded-lg border border-red-300/30 bg-red-400/10 p-3 text-sm leading-6 text-red-200">{formError || error}</p> : null}
            </div>
          </aside>

          <VideoPreview video={video} isRendering={isRendering} selectedStyle={selectedStyle} duration={"5s"} aspectRatio={aspectRatio} onDownload={downloadExport} />
        </div>

        <SavedRenders history={history} isLoading={isHistoryLoading} onOpen={setVideo} onDownload={downloadVideo} />
      </div>
    </PageShell>
  );
}

function PanelSection({ children, icon: Icon, title }: { children: React.ReactNode; icon: LucideIcon; title: string }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ProductUpload({ onSelect, previewUrl, productFile }: { onSelect: (file: File | null) => void; previewUrl: string; productFile: File | null }) {
  const { t } = useTranslation();

  return (
    <label className="group relative grid min-h-52 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-card p-4 text-center transition hover:border-primary/60 hover:bg-soft-green-surface focus-within:ring-2 focus-within:ring-primary/70">
      <input
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          onSelect(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Product preview" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-3 bottom-3 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-start text-white backdrop-blur-md">
            <p className="truncate text-sm font-semibold">{productFile?.name}</p>
            <p className="text-xs text-white/70">{productFile ? `${Math.max(productFile.size / 1024 / 1024, 0.01).toFixed(2)} MB` : null}</p>
          </div>
        </>
      ) : (
        <div>
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <ImagePlus className="size-7" />
          </div>
          <p className="text-sm font-semibold text-foreground">{t("video.uploadProductImage")}</p>
          <p className="mt-1 text-xs text-muted">{t("studio.fileTypes")}</p>
        </div>
      )}
    </label>
  );
}

function SegmentedOptions<T extends string>({ onChange, options, value }: { onChange: (value: T) => void; options: readonly T[]; value: T }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <Button key={option} type="button" variant="secondary" onClick={() => onChange(option)} className={cn(value === option && "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_3px_var(--focus-ring)]")}>
          {option}
        </Button>
      ))}
    </div>
  );
}

function VideoPreview({
  aspectRatio,
  duration,
  isRendering,
  onDownload,
  selectedStyle,
  video,
}: {
  aspectRatio: AspectOption;
  duration: DurationOption;
  isRendering: boolean;
  onDownload: () => void | undefined;
  selectedStyle: string;
  video: VideoRecord | null;
}) {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--panel-shadow)]">
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">{t("video.preview")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{t("video.previewDesc")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">{selectedStyle}</span>
            <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">{duration}</span>
            <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">{aspectRatio}</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className={cn("relative mx-auto overflow-hidden rounded-lg border border-border bg-surface", aspectRatio === "9:16" ? "aspect-[9/16] max-h-[720px] max-w-[420px]" : "aspect-video w-full")}>
          {isRendering ? (
            <div className="grid size-full place-items-center bg-surface">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 size-12 animate-spin text-primary" />
                <p className="font-display text-2xl font-semibold text-foreground">{t("video.generatingVideo")}</p>
                <p className="mt-2 text-sm text-muted">{t("video.renderingSequence")}</p>
              </div>
              <div className="absolute inset-0 shimmer opacity-20" />
            </div>
          ) : video?.videoUrl ? (
            <video className="size-full object-contain" controls playsInline poster={video.thumbnailUrl} src={video.videoUrl} />
          ) : (
            <div className="grid size-full place-items-center text-center">
              <div>
                <div className="mx-auto mb-5 grid size-20 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Play className="ms-1 size-9 rtl:rotate-180" />
                </div>
                <h3 className="font-display text-3xl font-semibold text-foreground">{t("video.noVideo")}</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">{t("video.noVideoDesc")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{video?.title ?? t("video.waitingForRender")}</p>
          <p className="mt-1 text-xs text-muted">{video ? `${video.selectedStyle} - ${formatDate(video.createdAt)}` : t("video.generatedWillAppear")}</p>
        </div>
        <Button variant="secondary" type="button" onClick={onDownload} disabled={!video?.videoUrl}>
          <Download className="size-4" />
          {t("common.download")}
        </Button>
      </div>
    </section>
  );
}

function SavedRenders({
  history,
  isLoading,
  onDownload,
  onOpen,
}: {
  history: VideoRecord[];
  isLoading: boolean;
  onDownload: (video: VideoRecord) => void;
  onOpen: (video: VideoRecord) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--panel-shadow)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">{t("video.renderLibrary")}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">{t("video.savedRenders")}</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-lg" />) : null}
        {!isLoading && history.length === 0 ? (
          <div className="col-span-full grid min-h-52 place-items-center rounded-lg border border-dashed border-border bg-surface p-6 text-center">
            <div>
              <Film className="mx-auto mb-3 size-8 text-primary" />
              <p className="font-display text-lg font-semibold text-foreground">{t("video.noSavedRenders")}</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">{t("video.noSavedRendersDesc")}</p>
            </div>
          </div>
        ) : null}
        {history.map((item) => (
          <VideoResultCard key={item.id} video={item} onOpen={() => onOpen(item)} onDownload={() => onDownload(item)} />
        ))}
      </div>
    </section>
  );
}

function VideoResultCard({ onDownload, onOpen, video }: { onDownload: () => void; onOpen: () => void; video: VideoRecord }) {
  const { t } = useTranslation();

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-surface transition hover:border-primary/45 hover:shadow-[var(--panel-shadow)]">
      <button type="button" onClick={onOpen} className="relative block aspect-video w-full bg-card text-start">
        {video.videoUrl ? (
          <video className="size-full object-cover opacity-85 transition group-hover:opacity-100" muted playsInline preload="metadata" poster={video.thumbnailUrl} src={video.videoUrl} />
        ) : (
          <div className="grid size-full place-items-center bg-surface-container">
            <Film className="size-8 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
        <div className="absolute inset-x-3 bottom-3">
          <p className="line-clamp-1 text-sm font-semibold text-white">{video.title}</p>
          <p className="mt-1 text-xs text-white/70">{formatDate(video.createdAt)}</p>
        </div>
      </button>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-muted">{video.selectedStyle}</span>
          <span className="text-xs text-muted">{video.renderStatus}</span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted">{video.prompt}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onDownload} disabled={!video.videoUrl}>
            <Download className="size-3" />
            {t("common.download")}
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={onOpen}>
            <RefreshCw className="size-3" />
            {t("common.view")}
          </Button>
        </div>
      </div>
    </article>
  );
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return url;
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
