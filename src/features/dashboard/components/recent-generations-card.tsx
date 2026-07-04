"use client";

import { ArrowRight, Check, Copy, Download, Loader2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardGenerations, type DashboardGeneration } from "@/features/dashboard/services";
import { GrowthEngineResults } from "@/features/growth-engine/components/growth-engine-results";
import { getGrowthProject } from "@/features/growth-engine/services";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

/* eslint-disable @next/next/no-img-element */

export function RecentGenerationsCard({ items }: { items: DashboardGeneration[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<DashboardGeneration | null>(null);
  const generationsQuery = useQuery({
    enabled: open,
    queryFn: getDashboardGenerations,
    queryKey: ["dashboard-generations"],
  });
  const allItems = generationsQuery.data?.items ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentGenerations")}</CardTitle>
          <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(true)}>
            {t("common.viewAll")} <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <GenerationTile key={item.id} item={item} onPreview={setPreview} />
              ))}
              <NewGenerationLink />
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border bg-surface p-6 text-center">
              <div>
                <Sparkles className="mx-auto mb-3 size-7 text-primary" />
                <h3 className="font-display text-lg font-semibold text-foreground">{t("dashboard.noGenerations")}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{t("dashboard.noGenerationsDesc")}</p>
                <Button asChild className="mt-5">
                  <Link href="/creator-studio">
                    <Sparkles className="size-4" />
                    {t("dashboard.startGenerating")}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CenteredModal open={open} onOpenChange={setOpen} className="w-[min(calc(100vw-2rem),72rem)]">
        <div className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden rounded-lg">
          <header className="shrink-0 border-b border-border px-5 py-4 pe-14 sm:px-6 sm:py-5">
            <h2 className="font-display text-2xl font-semibold">{t("dashboard.allGenerations")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{t("dashboard.allGenerationsDesc")}</p>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
            {generationsQuery.isLoading ? (
              <div className="grid min-h-64 place-items-center text-muted">
                <Loader2 className="mb-3 size-6 animate-spin text-primary" />
                {t("common.loading")}
              </div>
            ) : null}
            {generationsQuery.isError ? (
              <div className="grid min-h-64 place-items-center text-center text-sm text-red-100">
                Generations could not be loaded.
              </div>
            ) : null}
            {!generationsQuery.isLoading && !generationsQuery.isError && allItems.length === 0 ? (
              <div className="grid min-h-64 place-items-center text-center text-sm text-muted">
                {t("dashboard.noGenerations")}
              </div>
            ) : null}
            {allItems.length > 0 ? (
              <div className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allItems.map((item) => (
                  <GenerationTile key={`${item.type}-${item.id}`} item={item} onPreview={setPreview} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </CenteredModal>

      <ImagePreviewDialog item={preview} onOpenChange={(nextOpen) => !nextOpen && setPreview(null)} />
    </>
  );
}

function NewGenerationLink() {
  const { t } = useTranslation();

  return (
    <Link href="/creator-studio" className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border bg-surface text-center transition-colors hover:border-primary/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
      <span>
        <Sparkles className="mx-auto mb-2 size-6 text-primary" />
        <span className="text-sm font-semibold text-muted">{t("dashboard.newGeneration")}</span>
      </span>
    </Link>
  );
}

function GenerationTile({ item, onPreview }: { item: DashboardGeneration; onPreview: (item: DashboardGeneration) => void }) {
  const { t } = useTranslation();
  const isGrowthEngine = item.type === "AI Growth Engine";
  const canPreview = isGrowthEngine || Boolean(item.imageUrl || item.isCampaign || item.isVideo);

  const handleClick = () => {
    onPreview(item);
  };

  return (
    <article className="relative min-h-40 overflow-hidden rounded-lg border border-primary/15 bg-primary/[0.04]">
      {item.imageUrl ? (
        <button type="button" onClick={handleClick} className="absolute inset-0 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow" aria-label={`Open ${item.title}`}>
          <img src={item.imageUrl} alt={item.title} className="size-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" decoding="async" />
        </button>
      ) : (
        <>
          <div className={cn("absolute inset-0 bg-gradient-to-br", item.color)} aria-hidden="true" />
          {canPreview ? (
            <button type="button" onClick={handleClick} className="absolute inset-0 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow" aria-label={`Open ${item.title}`} />
          ) : null}
        </>
      )}
      <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <h3 className="truncate text-sm font-semibold text-white">{item.title}</h3>
        <p className="mt-1 text-xs text-muted">{item.type}</p>
      </div>
      {item.imageUrl && item.downloadUrl ? (
        <Button asChild variant="secondary" size="icon" className="absolute end-3 top-3 size-9 min-h-9 rounded-full bg-card/85 backdrop-blur-md" aria-label={`Download ${item.title}`}>
          <a href={item.downloadUrl} onClick={(event) => event.stopPropagation()}>
            <Download className="size-4" />
          </a>
        </Button>
      ) : null}
      {canPreview ? <span className="sr-only">{t("dashboard.openDetails")}</span> : null}
    </article>
  );
}

function ImagePreviewDialog({ item, onOpenChange }: { item: DashboardGeneration | null; onOpenChange: (open: boolean) => void }) {
  return (
    <CenteredModal open={Boolean(item)} onOpenChange={onOpenChange} className="w-[min(calc(100vw-2rem),72rem)]">
      {item ? (
        <div className="overflow-hidden rounded-lg bg-background">
          {item.type === "AI Growth Engine" ? (
            <GrowthEnginePreview item={item} />
          ) : item.isCampaign ? (
            <CampaignPreview item={item} />
          ) : (
            <AssetPreview item={item} />
          )}
        </div>
      ) : null}
    </CenteredModal>
  );
}

function GrowthEnginePreview({ item }: { item: DashboardGeneration }) {
  const { t } = useTranslation();
  const projectQuery = useQuery({
    queryKey: ["growth-engine-project", item.id],
    queryFn: async () => {
      const response = await getGrowthProject(item.id);
      return response.project;
    },
  });

  return (
    <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 pe-14 sm:p-6 sm:pe-14">
      <header className="mb-6 border-b border-border pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{item.type}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">{item.title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{item.description || "Saved AI Growth Engine project."}</p>
        <p className="mt-3 text-xs font-semibold text-secondary">Generated {formatDate(item.createdAt)}</p>
      </header>

      {projectQuery.isLoading ? (
        <div className="flex justify-center p-12 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : projectQuery.isError ? (
        <div className="p-12 text-center text-red-400">{t("dashboard.failedLoadProject")}</div>
      ) : projectQuery.data ? (
        <GrowthEngineResults liveProject={projectQuery.data} />
      ) : null}
    </div>
  );
}

function CampaignPreview({ item }: { item: DashboardGeneration }) {
  const { t } = useTranslation();

  return (
    <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 pe-14 sm:p-6 sm:pe-14">
      <header className="mb-6 border-b border-border pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{item.type}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">{item.title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{item.description || "Saved social campaign generation."}</p>
        <p className="mt-3 text-xs font-semibold text-secondary">Generated {formatDate(item.createdAt)}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {(item.posts ?? []).map((post, index) => (
          <div key={post.id || index} className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Post {index + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{post.title}</h3>
              </div>
              <span className="rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">{post.platform}</span>
            </div>
            <CopyPanel label={t("dashboard.caption")} value={post.caption} />
            <div className="mt-3">
              <CopyPanel label={t("dashboard.visualDirection")} value={post.visualDirection} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetPreview({ item }: { item: DashboardGeneration }) {
  const { t } = useTranslation();

  return (
    <div className="grid max-h-[calc(100dvh-2rem)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid min-h-[42vh] place-items-center bg-surface-container p-4 sm:min-h-[56vh] sm:p-6">
        {item.isVideo && item.videoUrl ? (
          <video src={item.videoUrl} poster={item.imageUrl} controls playsInline className="max-h-[calc(100dvh-10rem)] w-full rounded-lg object-contain shadow-[0_28px_90px_rgba(0,0,0,0.45)]" />
        ) : item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="max-h-[calc(100dvh-10rem)] w-full rounded-lg object-contain shadow-[0_28px_90px_rgba(0,0,0,0.45)]" />
        ) : null}
      </div>
      <aside className="space-y-5 border-s border-border bg-card p-5 pe-14 sm:p-6 sm:pe-14">
        <header className="space-y-2">
          <h2 className="font-display text-2xl font-semibold">{item.title}</h2>
          <p className="text-sm leading-6 text-muted">{item.type}</p>
          <p className="text-xs font-semibold text-secondary">Generated {formatDate(item.createdAt)}</p>
        </header>

        {item.downloadUrl || item.videoUrl ? (
          <Button asChild className="w-full">
            <a href={item.downloadUrl ?? item.videoUrl}>
              <Download className="size-4" />
              {item.isVideo ? "Download Video" : "Download Image"}
            </a>
          </Button>
        ) : null}

        {item.isVideo ? <CopyPanel label={t("dashboard.prompt")} value={item.description ?? ""} /> : null}

        {item.isStoryboard ? (
          <div className="space-y-4">
            <CopyPanel label={t("dashboard.hook")} value={item.hook ?? item.title} />
            <CopyPanel label={t("dashboard.caption")} value={item.caption ?? ""} />
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function CenteredModal({
  children,
  className,
  onOpenChange,
  open,
}: {
  children: ReactNode;
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid h-dvh w-dvw place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" type="button" aria-label={t("dashboard.closeModal")} onClick={() => onOpenChange(false)} />
      <section className={cn("glass-panel relative z-10 max-h-[calc(100dvh-2rem)] overflow-hidden rounded-lg shadow-glow", className)}>
        <button className="absolute end-4 top-4 z-20 rounded-lg p-2 text-muted transition-colors hover:bg-card hover:text-foreground" type="button" onClick={() => onOpenChange(false)} aria-label={t("common.close")}>
          <X className="size-4" />
        </button>
        {children}
      </section>
    </div>,
    document.body,
  );
}

function CopyPanel({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
        <Button type="button" variant="secondary" size="sm" className="h-8 min-h-8 px-2" onClick={() => void copyValue()} disabled={!value}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? t("common.copied") : t("common.copy")}
        </Button>
      </div>
      <p className="text-sm leading-6 text-foreground">{value || t("dashboard.noSavedText")}</p>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date unavailable";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
