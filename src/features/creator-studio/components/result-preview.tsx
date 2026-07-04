"use client";

/* eslint-disable @next/next/no-img-element */

import { Download, ImageIcon, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/features/creator-studio/components/loading-overlay";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

type ResultPreviewProps = {
  aspectRatio: "9:16" | "16:9";
  generatedImage: string | null;
  loading: boolean;
  productImage: File | null;
  referenceImage: File | null;
};

export function ResultPreview({ aspectRatio, generatedImage, loading, productImage, referenceImage }: ResultPreviewProps) {
  const { t } = useTranslation();
  const isVertical = aspectRatio === "9:16";
  const productPreview = useObjectUrl(productImage);
  const referencePreview = useObjectUrl(referenceImage);

  return (
    <section className="relative min-h-[720px] overflow-hidden rounded-lg border border-border bg-card shadow-[var(--panel-shadow)]">
      {loading ? <LoadingOverlay /> : null}

      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl font-semibold text-foreground">{t("studio.output")}</p>
            {/* <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Monitor source assets, selected dimensions, and the generated advertisement output.</p> */}
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted">{aspectRatio}</span>
            {generatedImage ? (
              <Button asChild variant="secondary">
                <a href={generatedImage} download={`marketly-ai-advertisement-${aspectRatio.replace(":", "x")}.png`}>
                  <Download className="size-4" />
                  {t("common.export")}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        {/* <div className="grid gap-4 md:grid-cols-2">
          <SourcePreview title={t("studio.productImage")} imageUrl={productPreview} emptyLabel={t("studio.waitingProduct")} />
          <SourcePreview title={t("studio.referenceAd")} imageUrl={referencePreview} emptyLabel={t("studio.waitingReference")} />
        </div> */}

        <div
          className={cn(
            "relative mx-auto w-full overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--panel-shadow)] transition-all duration-300",
            isVertical ? "aspect-[9/16] max-h-[760px] max-w-[430px]" : "aspect-video max-w-[980px]",
          )}
        >
          {generatedImage ? (
            <div className="relative size-full animate-[page-enter_240ms_ease-out_both]">
              <img src={generatedImage} alt={t("studio.generatedAd")} className="absolute inset-0 size-full object-contain" />
              <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between bg-gradient-to-b from-black/65 to-transparent p-4">
                <span className="rounded-lg border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{t("studio.generatedAd")}</span>
              </div>
            </div>
          ) : (
            <div className="grid size-full place-items-center p-6 text-center">
              <div>
                <div className="mx-auto grid size-16 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Sparkles className="size-7" />
                </div>
                <p className="mt-5 font-display text-2xl font-semibold text-foreground">{t("studio.renderHere")}</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{t("studio.renderHereDesc")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SourcePreview({ emptyLabel, imageUrl, title }: { emptyLabel: string; imageUrl: string | null; title: string }) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-xs font-semibold uppercase text-muted">{title}</p>
        <span className={cn("text-xs font-medium", imageUrl ? "text-primary" : "text-muted")}>{imageUrl ? t("common.ready") : t("common.pending")}</span>
      </div>
      <div className="relative grid aspect-video place-items-center bg-card">
        {imageUrl ? (
          <img src={imageUrl} alt={`${title} preview`} className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto mb-2 size-5 text-muted" />
            <p className="text-xs text-muted">{emptyLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return url;
}
