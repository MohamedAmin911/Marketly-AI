"use client";

import {
  Activity,
  BarChart3,
  CalendarClock,
  Clapperboard,
  FolderKanban,
  ImagePlus,
  Megaphone,
  Rocket,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/shared/error-state";
import { GrowthChart } from "@/components/shared/lazy-charts";
import { PanelSkeleton } from "@/components/shared/loaders";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickActionsCard } from "@/features/dashboard/components/quick-actions-card";
import { RecentGenerationsCard } from "@/features/dashboard/components/recent-generations-card";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type { DashboardGeneration } from "@/features/dashboard/services";
import type { Metric } from "@/types/common";

import { useBilling, type BillingInfo } from "@/features/billing/hooks/use-billing";
import { useTranslation } from "@/lib/i18n/useTranslation";

const heroActions = [
  { href: "/creator-studio", icon: ImagePlus, labelKey: "quick.generateAd" },
  { href: "/growth-engine", icon: Rocket, labelKey: "dashboard.buildGrowthPlan", feature: "growthEngine" },
  { href: "/videos", icon: Clapperboard, labelKey: "dashboard.createVideo" },
] as const;

export function DashboardView() {
  const { data, isLoading, isError } = useDashboard();
  const { billing } = useBilling();
  const { t } = useTranslation();
  
  const metrics = data?.metrics ?? [];
  const recentGenerations = data?.recentGenerations ?? [];
  const kpis = buildKpis(metrics, recentGenerations, t);
  const timelineItems = recentGenerations.slice(0, 5);

  return (
    <PageShell title={t("dashboard.title")} description={t("dashboard.description")}>
      {isLoading ? <PanelSkeleton /> : null}
      {isError ? <ErrorState message={t("dashboard.dataLoadError")} /> : null}
      {data ? (
        <div className="space-y-6">
          <DashboardHero metrics={metrics} recentGenerations={recentGenerations} billing={billing} features={billing?.features} />

          <section aria-labelledby="dashboard-kpis">
            <SectionHeader title={t("dashboard.performanceSnapshot")} description={t("dashboard.performanceSnapshotDesc")} />
            <div id="dashboard-kpis" className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>{t("dashboard.growthPerformance")}</CardTitle>
                    <p className="mt-1 text-sm leading-6 text-muted">{t("dashboard.growthPerformanceDesc")}</p>
                  </div>
                  {/* <div className="flex gap-2" aria-label="Chart range">
                    {["7D", "30D", "90D"].map((item) => (
                      <Button key={item} variant={item === "30D" ? "default" : "secondary"} size="sm" className="h-8 min-h-8 px-3" type="button">
                        {item}
                      </Button>
                    ))}
                  </div> */}
                </CardHeader>
                <CardContent>
                  {data.growthTrend.length > 0 ? (
                    <GrowthChart data={data.growthTrend} />
                  ) : (
                    <div className="grid min-h-60 place-items-center rounded-lg border border-dashed border-border bg-surface text-center">
                      <div>
                        <TrendingUp className="mx-auto mb-3 size-7 text-primary" aria-hidden="true" />
                        <p className="font-display text-lg font-semibold text-foreground">{t("dashboard.noGrowthTrend")}</p>
                        <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{t("dashboard.noGrowthTrendDesc")}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <RecentGenerationsCard items={recentGenerations} />
            </div>

            <aside className="space-y-5" aria-label={t("dashboard.activityActions")}>
              <RecentActivityTimeline items={timelineItems} />
              <QuickActionsCard features={billing?.features} />
            </aside>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function DashboardHero({ metrics, recentGenerations, billing, features }: { metrics: Metric[]; recentGenerations: DashboardGeneration[]; billing: BillingInfo | null | undefined; features?: Record<string, boolean> }) {
  const { t } = useTranslation();
  const projects = findMetric(metrics, "Projects")?.value ?? "0";
  const latest = recentGenerations[0];

  const actions = heroActions.filter(
    (action: any) => !action.feature || (features && features[action.feature])
  );

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8">
        <div className="flex min-h-64 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {t("dashboard.workspace")}
              </span>
              {billing?.subscription?.plan && (
                <span className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted capitalize shadow-sm">
                  {billing.subscription.plan === "free" ? t("dashboard.freePlan") : `${billing.subscription.plan} ${t("dashboard.plan")}`}
                </span>
              )}
            </div>
            <h2 className="mt-5 max-w-3xl font-display text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              {t("dashboard.heroTitle")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              {t("dashboard.heroDescription")}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button key={action.href} asChild variant={action.href === "/creator-studio" ? "default" : "secondary"}>
                <Link href={action.href}>
                  <action.icon className="size-4" />
                  {t(action.labelKey)}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid content-between gap-4 rounded-lg border border-border bg-surface p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted">{t("dashboard.workspacePulse")}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat label={t("dashboard.projects")} value={projects} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
              <CalendarClock className="size-3.5 text-primary" aria-hidden="true" />
              {t("dashboard.latestGeneration")}
            </p>
            {latest ? (
              <>
                <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{latest.title}</p>
                <p className="mt-1 text-xs text-muted">{latest.type}</p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">{t("dashboard.noSavedGenerations")}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

type KpiCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  tone?: Metric["tone"];
  value: string;
};

function KpiCard({ description, icon: Icon, label, tone = "neutral", value }: KpiCardProps) {
  const toneClass = tone === "success" ? "text-primary" : tone === "warning" ? "text-tertiary" : tone === "danger" ? "text-red-200" : "text-muted";

  return (
    <Card className="min-h-36 w-full">
      <CardContent className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase text-muted">{label}</p>
          <span className="grid size-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-foreground">{value}</p>
          <p className={`mt-2 text-xs leading-5 ${toneClass}`}>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityTimeline({ items }: { items: DashboardGeneration[] }) {
  const { language, t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
        <Activity className="size-4 text-muted" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ol className="space-y-4">
            {items.map((item, index) => {
              const Icon = iconForGeneration(item);

              return (
                <li key={`${item.type}-${item.id}`} className="relative grid grid-cols-[2.25rem_1fr] gap-3">
                  {index < items.length - 1 ? <span className="absolute start-[1.0625rem] top-9 h-[calc(100%-.75rem)] w-px bg-border" aria-hidden="true" /> : null}
                  <span className="relative z-10 grid size-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 rounded-lg border border-border bg-surface p-3">
                    <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">{item.type}</p>
                    <p className="mt-2 text-xs text-secondary">{formatActivityDate(item.createdAt, language, t)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-surface text-center">
            <div>
              <Activity className="mx-auto mb-3 size-6 text-primary" aria-hidden="true" />
              <p className="font-display text-lg font-semibold text-foreground">{t("dashboard.noRecentActivity")}</p>
              <p className="mt-1 max-w-xs text-sm leading-6 text-muted">{t("dashboard.noRecentActivityDesc")}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function buildKpis(metrics: Metric[], recentGenerations: DashboardGeneration[], t: ReturnType<typeof useTranslation>["t"]): KpiCardProps[] {
  const projects = findMetric(metrics, "Projects");
  const generatedAssets = findMetric(metrics, "Generated Assets");
  const viralEngine = findMetric(metrics, "Viral Engine");
  const analytics = findMetric(metrics, "Analytics");
  const videosCount = recentGenerations.filter((item) => item.isVideo || item.type.toLowerCase().includes("video")).length;

  return [
    {
      description: projects?.delta ?? t("dashboard.activeWorkspaceProjects"),
      icon: FolderKanban,
      label: t("dashboard.projects"),
      tone: projects?.tone,
      value: projects?.value ?? "0",
    },
    {
      description: generatedAssets?.delta ?? t("dashboard.savedAiOutputs"),
      icon: Sparkles,
      label: t("dashboard.generatedAssets"),
      tone: generatedAssets?.tone,
      value: generatedAssets?.value ?? "0",
    },
    {
      description: videosCount > 0 ? t("dashboard.recentSavedVideos") : t("dashboard.noRecentVideos"),
      icon: Clapperboard,
      label: t("dashboard.videos"),
      tone: videosCount > 0 ? "success" : "neutral",
      value: videosCount.toLocaleString(),
    },
    {
      description: viralEngine && viralEngine.value !== "0" ? viralEngine.delta : t("dashboard.noGenerations"),
      icon: TrendingUp,
      label: t("nav.viralEngine"),
      tone: viralEngine?.tone,
      value: viralEngine?.value ?? "0",
    },
    {
      description: analytics && analytics.value !== "0" ? analytics.delta : t("dashboard.noGenerations"),
      icon: BarChart3,
      label: t("nav.analytics"),
      tone: analytics?.tone,
      value: analytics?.value ?? "0",
    },
    // {
    //   description: ctr?.delta ?? "No analytics recorded yet",
    //   icon: Gauge,
    //   label: "CTR",
    //   tone: ctr?.tone,
    //   value: ctr?.value ?? "0%",
    // },
    // {
    //   description: "ROI data is not recorded in the current summary",
    //   icon: PieChart,
    //   label: "ROI",
    //   value: "0%",
    // },
  ];
}

function findMetric(metrics: Metric[], label: string) {
  return metrics.find((metric) => metric.label.toLowerCase().includes(label.toLowerCase()));
}

function iconForGeneration(item: DashboardGeneration): LucideIcon {
  const type = item.type.toLowerCase();
  if (item.isVideo || type.includes("video")) return Clapperboard;
  if (item.isCampaign || type.includes("campaign")) return Megaphone;
  if (type.includes("growth")) return Rocket;
  if (type.includes("analytics")) return BarChart3;
  return Sparkles;
}

function formatActivityDate(value: string | undefined, language: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (!value) return t("dashboard.dateUnavailable");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("dashboard.dateUnavailable");

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
