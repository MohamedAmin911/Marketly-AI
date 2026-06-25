"use client";

import {
  Activity,
  BarChart3,
  CalendarClock,
  Clapperboard,
  FolderKanban,
  Gauge,
  ImagePlus,
  Megaphone,
  PieChart,
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

const heroActions = [
  { href: "/creator-studio", icon: ImagePlus, label: "Generate Ad" },
  { href: "/growth-engine", icon: Rocket, label: "Build Growth Plan" },
  { href: "/videos", icon: Clapperboard, label: "Create Video" },
];

export function DashboardView() {
  const { data, isLoading, isError } = useDashboard();
  const metrics = data?.metrics ?? [];
  const recentGenerations = data?.recentGenerations ?? [];
  const kpis = buildKpis(metrics, recentGenerations);
  const timelineItems = recentGenerations.slice(0, 5);

  return (
    <PageShell title="Dashboard" description="Your AI marketing command center for projects, campaigns, creative output, and growth signals.">
      {isLoading ? <PanelSkeleton /> : null}
      {isError ? <ErrorState message="Dashboard data could not be loaded. Retry from the browser refresh control." /> : null}
      {data ? (
        <div className="space-y-6">
          <DashboardHero metrics={metrics} recentGenerations={recentGenerations} />

          <section aria-labelledby="dashboard-kpis">
            <SectionHeader title="Performance Snapshot" description="A quick read on workspace volume and available analytics." />
            <div id="dashboard-kpis" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
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
                    <CardTitle>Growth Performance</CardTitle>
                    <p className="mt-1 text-sm leading-6 text-muted">Recent output momentum based on saved projects, campaigns, assets, storyboards, and videos.</p>
                  </div>
                  <div className="flex gap-2" aria-label="Chart range">
                    {["7D", "30D", "90D"].map((item) => (
                      <Button key={item} variant={item === "30D" ? "default" : "secondary"} size="sm" className="h-8 min-h-8 px-3" type="button">
                        {item}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {data.growthTrend.length > 0 ? (
                    <GrowthChart data={data.growthTrend} />
                  ) : (
                    <div className="grid min-h-60 place-items-center rounded-lg border border-dashed border-border bg-surface text-center">
                      <div>
                        <TrendingUp className="mx-auto mb-3 size-7 text-primary" aria-hidden="true" />
                        <p className="font-display text-lg font-semibold text-foreground">No growth trend yet</p>
                        <p className="mt-1 max-w-sm text-sm leading-6 text-muted">Create campaigns or assets to populate performance history.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <RecentGenerationsCard items={recentGenerations} />
            </div>

            <aside className="space-y-5" aria-label="Dashboard activity and actions">
              <RecentActivityTimeline items={timelineItems} />
              <QuickActionsCard />
            </aside>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function DashboardHero({ metrics, recentGenerations }: { metrics: Metric[]; recentGenerations: DashboardGeneration[] }) {
  const projects = findMetric(metrics, "Projects")?.value ?? "0";
  const campaigns = findMetric(metrics, "Campaigns")?.value ?? "0";
  const latest = recentGenerations[0];

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8">
        <div className="flex min-h-64 flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Marketly AI Workspace
            </span>
            <h2 className="mt-5 max-w-3xl font-display text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Welcome back. Your growth workspace is ready.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Continue building campaigns, generating assets, and tracking what your team has produced from one focused dashboard.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {heroActions.map((action) => (
              <Button key={action.href} asChild variant={action.href === "/creator-studio" ? "default" : "secondary"}>
                <Link href={action.href}>
                  <action.icon className="size-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid content-between gap-4 rounded-lg border border-border bg-surface p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted">Workspace Pulse</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat label="Projects" value={projects} />
              <MiniStat label="Campaigns" value={campaigns} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
              <CalendarClock className="size-3.5 text-primary" aria-hidden="true" />
              Latest generation
            </p>
            {latest ? (
              <>
                <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{latest.title}</p>
                <p className="mt-1 text-xs text-muted">{latest.type}</p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">No saved generations yet. Start with a quick action.</p>
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
    <Card className="min-h-36">
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <Activity className="size-4 text-muted" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ol className="space-y-4">
            {items.map((item, index) => {
              const Icon = iconForGeneration(item);

              return (
                <li key={`${item.type}-${item.id}`} className="relative grid grid-cols-[2.25rem_1fr] gap-3">
                  {index < items.length - 1 ? <span className="absolute left-[1.0625rem] top-9 h-[calc(100%-.75rem)] w-px bg-border" aria-hidden="true" /> : null}
                  <span className="relative z-10 grid size-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 rounded-lg border border-border bg-surface p-3">
                    <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">{item.type}</p>
                    <p className="mt-2 text-xs text-secondary">{formatActivityDate(item.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border bg-surface text-center">
            <div>
              <Activity className="mx-auto mb-3 size-6 text-primary" aria-hidden="true" />
              <p className="font-display text-lg font-semibold text-foreground">No recent activity</p>
              <p className="mt-1 max-w-xs text-sm leading-6 text-muted">Your saved work will appear here as you create it.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function buildKpis(metrics: Metric[], recentGenerations: DashboardGeneration[]): KpiCardProps[] {
  const projects = findMetric(metrics, "Projects");
  const campaigns = findMetric(metrics, "Campaigns");
  const generatedAssets = findMetric(metrics, "Generated Assets");
  const ctr = findMetric(metrics, "CTR");
  const videosCount = recentGenerations.filter((item) => item.isVideo || item.type.toLowerCase().includes("video")).length;

  return [
    {
      description: projects?.delta ?? "Active workspace projects",
      icon: FolderKanban,
      label: "Projects",
      tone: projects?.tone,
      value: projects?.value ?? "0",
    },
    {
      description: campaigns?.delta ?? "Campaign records",
      icon: Megaphone,
      label: "Campaigns",
      tone: campaigns?.tone,
      value: campaigns?.value ?? "0",
    },
    {
      description: generatedAssets?.delta ?? "Saved AI outputs",
      icon: Sparkles,
      label: "Generated Assets",
      tone: generatedAssets?.tone,
      value: generatedAssets?.value ?? "0",
    },
    {
      description: videosCount > 0 ? "Recent saved videos" : "No recent videos yet",
      icon: Clapperboard,
      label: "Videos",
      tone: videosCount > 0 ? "success" : "neutral",
      value: videosCount.toLocaleString(),
    },
    {
      description: ctr?.delta ?? "No analytics recorded yet",
      icon: Gauge,
      label: "CTR",
      tone: ctr?.tone,
      value: ctr?.value ?? "0%",
    },
    {
      description: "ROI data is not recorded in the current summary",
      icon: PieChart,
      label: "ROI",
      value: "0%",
    },
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

function formatActivityDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
