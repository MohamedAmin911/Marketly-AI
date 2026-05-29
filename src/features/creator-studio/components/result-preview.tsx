"use client";

/* eslint-disable @next/next/no-img-element */

import { Download, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/features/creator-studio/components/loading-overlay";
import { cn } from "@/lib/utils";

type ResultPreviewProps = {
  aspectRatio: "9:16" | "16:9";
  generatedImage: string | null;
  loading: boolean;
};

export function ResultPreview({ aspectRatio, generatedImage, loading }: ResultPreviewProps) {
  const isVertical = aspectRatio === "9:16";

  return (
    <section className="glass-panel relative min-h-[720px] overflow-hidden rounded-lg">
      {loading ? <LoadingOverlay /> : null}

      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl font-semibold text-white">Advertisement Preview</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Generated after image only, locked to your selected commercial format.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-muted">{aspectRatio}</span>
            {generatedImage ? (
              <Button asChild variant="secondary">
                <a href={generatedImage} download={`marketly-ai-advertisement-${aspectRatio.replace(":", "x")}.png`}>
                  <Download className="size-4" />
                  Download
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid min-h-[620px] place-items-center p-5 sm:p-6">
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-lg border border-white/10 bg-black/25 shadow-[0_30px_100px_rgba(0,0,0,0.35)] transition-all duration-300",
            isVertical ? "aspect-[9/16] max-h-[760px] max-w-[430px]" : "aspect-video max-w-[980px]",
          )}
        >
          {generatedImage ? (
            <div className="relative size-full animate-[page-enter_240ms_ease-out_both]">
              <img src={generatedImage} alt="Generated advertisement" className="absolute inset-0 size-full object-contain" />
              <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between bg-gradient-to-b from-black/65 to-transparent p-4">
                <span className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white backdrop-blur">Generated Advertisement</span>
              </div>
            </div>
          ) : (
            <div className="grid size-full place-items-center p-6 text-center">
              <div>
                <div className="mx-auto grid size-16 place-items-center rounded-lg border border-primary/15 bg-primary/[0.05] text-primary shadow-[0_0_34px_rgba(114,255,95,0.18)]">
                  <Sparkles className="size-7" />
                </div>
                <p className="mt-5 font-display text-2xl font-semibold text-white">Your commercial output appears here</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Choose 9:16 or 16:9, upload both images, then generate a polished advertisement.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
