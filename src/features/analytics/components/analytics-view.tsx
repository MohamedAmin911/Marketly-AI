"use client";

import { Activity, AlertTriangle, Banknote, BarChart3, Download, Eye, Filter, Lightbulb, MousePointerClick, Percent, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { DataTable } from "@/components/shared/data-table";
import { AnalyticsTrendChart, PerformanceChart } from "@/components/shared/lazy-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useAnalyticsIntelligence } from "@/features/analytics/hooks/use-analytics";
import { defaultAnalyticsFilters } from "@/features/analytics/services";
import type { AnalyticsFilterState, AnalyticsInsight, AnalyticsMetricCard, AnalyticsRecommendation } from "@/features/analytics/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

const metricIcons: Record<AnalyticsMetricCard["key"], LucideIcon> = {
  clicks: MousePointerClick,
  conversions: Target,
  cpc: Banknote,
  ctr: Percent,
  engagementRate: Activity,
  impressions: Eye,
  roi: TrendingUp,
};

const ranges: { label: string; value: AnalyticsFilterState["range"] }[] = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All", value: "all" },
];

const insightTypes = [
  { icon: Lightbulb, label: "Opportunity", type: "opportunity" },
  { icon: AlertTriangle, label: "Risk", type: "risk" },
  { icon: TrendingUp, label: "Trend", type: "trend" },
] as const;

export function AnalyticsView() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AnalyticsFilterState>(defaultAnalyticsFilters);
  const { data, isFetching, isLoading, refetch } = useAnalytics(filters);
  const intelligence = useAnalyticsIntelligence();
  const metricCards = useMemo(() => data?.metrics ?? [], [data?.metrics]);
  const visibleInsights = useMemo(() => intelligence.data?.insights ?? [], [intelligence.data?.insights]);
  const primaryRecommendation = data?.recommendations[0] ?? intelligence.data?.recommendations[0];

  function updateFilter(key: keyof AnalyticsFilterState, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function exportReport() {
    if (!data) return;

    const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marketly-analytics-report-${filters.range}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell
      title={t("analytics.title")}
      description={t("analytics.description")}
      actions={
        <>
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            {t("common.refresh")}
          </Button>
          <Button variant="secondary" onClick={exportReport} disabled={!data}>
            <Download className="size-4" />
            {t("analytics.exportReport")}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <FiltersPanel data={data} filters={filters} updateFilter={updateFilter} />

        <section>
          <SectionHeading title={t("analytics.kpiCards")} description={t("analytics.kpiCardsDesc")} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
            {isLoading
              ? Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-lg" />)
              : metricCards.map((metric) => <AnalyticsKpiCard key={metric.key} metric={metric} />)}
          </div>
        </section>

        <section>
          <SectionHeading title={t("analytics.charts")} description={t("analytics.chartsDesc")} />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <ChartCard title={t("analytics.trendAnalysis")} description={t("analytics.trendAnalysisDesc")} icon={BarChart3}>
              {data?.trends.length ? <AnalyticsTrendChart data={data.trends} /> : <ChartEmptyState label={t("analytics.trendEmpty")} />}
            </ChartCard>
            <TrafficSourcesCard sources={data?.sources ?? []} isLoading={isLoading} />
          </div>
          <div className="mt-5">
            <ChartCard title={t("analytics.conversions")} description={t("analytics.conversionsDesc")} icon={Target}>
              {data?.trends.length ? <PerformanceChart data={data.trends} /> : <ChartEmptyState label={t("analytics.conversionEmpty")} />}
            </ChartCard>
          </div>
        </section>

        <section>
          <SectionHeading title={t("analytics.aiInsights")} description={t("analytics.aiInsightsDesc")} />
          <div className="grid gap-4 lg:grid-cols-4">
            {intelligence.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-lg" />)
            ) : (
              <>
                {insightTypes.map((item) => (
                  <InsightCard key={item.type} title={item.label} icon={item.icon} insight={visibleInsights.find((insight) => insight.type === item.type)} />
                ))}
                <RecommendationInsight recommendation={primaryRecommendation} />
              </>
            )}
          </div>
        </section>

        <ReportsSection data={data} isLoading={isLoading} />
      </div>
    </PageShell>
  );
}

function FiltersPanel({
  data,
  filters,
  updateFilter,
}: {
  data: ReturnType<typeof useAnalytics>["data"];
  filters: AnalyticsFilterState;
  updateFilter: (key: keyof AnalyticsFilterState, value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Filter className="size-4" />
          </span>
          <div>
            <CardTitle>{t("analytics.filters")}</CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted">{t("analytics.filtersDesc")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        <FilterSelect label={t("analytics.dateRange")} value={filters.range} onChange={(value) => updateFilter("range", value)}>
          {ranges.map((range) => (
            <option key={range.value} value={range.value}>{range.label}</option>
          ))}
        </FilterSelect>
        <FilterSelect label={t("analytics.channel")} value={filters.channel} onChange={(value) => updateFilter("channel", value)}>
          <option value="all">{t("analytics.allChannels")}</option>
          {data?.filterOptions.channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
        </FilterSelect>
        <FilterSelect label={t("analytics.campaign")} value={filters.campaign} onChange={(value) => updateFilter("campaign", value)}>
          <option value="all">{t("analytics.allCampaigns")}</option>
          {data?.filterOptions.campaigns.map((campaign) => <option key={campaign} value={campaign}>{campaign}</option>)}
        </FilterSelect>
        <FilterSelect label={t("analytics.status")} value={filters.status} onChange={(value) => updateFilter("status", value)}>
          <option value="all">{t("analytics.allStatuses")}</option>
          {data?.filterOptions.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </FilterSelect>
      </CardContent>
    </Card>
  );
}

function FilterSelect({ children, label, onChange, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase text-muted">{label}</span>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </Select>
    </label>
  );
}

function AnalyticsKpiCard({ metric }: { metric: AnalyticsMetricCard }) {
  const Icon = metricIcons[metric.key];
  const direction = metric.delta >= 0 ? "+" : "";

  return (
    <Card className="min-h-36">
      <CardContent className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-semibold uppercase text-muted">{metric.label}</span>
          <span className="grid size-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-foreground">{metric.value}</p>
          <p className={cn("mt-2 text-xs leading-5", toneClass(metric.tone))}>{direction}{metric.delta}% vs previous period</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TrafficSourcesCard({ isLoading, sources }: { isLoading: boolean; sources: [string, number][] }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analytics.trafficSources")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 rounded-lg" />) : null}
        {!isLoading && sources.length === 0 ? <ChartEmptyState label={t("analytics.trafficEmpty")} /> : null}
        {sources.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-3">
            <div className="mb-2 flex justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">{label}</span>
              <span className="text-muted">{value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ChartCard({ children, description, icon: Icon, title }: { children: React.ReactNode; description: string; icon: LucideIcon; title: string }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
        <Icon className="size-5 text-primary" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InsightCard({ icon: Icon, insight, title }: { icon: LucideIcon; insight?: AnalyticsInsight; title: string }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {insight ? <p className="mt-1 text-sm leading-6 text-muted">{insight.title}</p> : null}
        </div>
        <Icon className="size-5 text-primary" />
      </CardHeader>
      <CardContent>
        {insight ? (
          <>
            <Badge tone={insight.severity === "high" ? "danger" : insight.severity === "medium" ? "warning" : "success"}>{insight.severity}</Badge>
            <p className="mt-3 text-sm leading-6 text-foreground">{insight.description}</p>
            <p className="mt-3 text-xs leading-5 text-primary">{insight.evidence}</p>
          </>
        ) : (
          <EmptyMini label={t("analytics.noInsight", { type: title.toLowerCase() })} />
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationInsight({ recommendation }: { recommendation?: AnalyticsRecommendation }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg">{t("analytics.recommendation")}</CardTitle>
          {recommendation ? <p className="mt-1 text-sm leading-6 text-muted">{recommendation.title}</p> : null}
        </div>
        <Sparkles className="size-5 text-primary" />
      </CardHeader>
      <CardContent>
        {recommendation ? (
          <>
            <Badge tone={recommendation.priority === "high" ? "danger" : recommendation.priority === "medium" ? "warning" : "success"}>{Math.round(recommendation.confidence * 100)}%</Badge>
            <p className="mt-3 text-sm leading-6 text-foreground">{recommendation.action}</p>
            <p className="mt-3 text-xs leading-5 text-primary">{recommendation.evidence}</p>
          </>
        ) : (
          <EmptyMini label={t("analytics.noRecommendation")} />
        )}
      </CardContent>
    </Card>
  );
}

function ReportsSection({ data, isLoading }: { data: ReturnType<typeof useAnalytics>["data"]; isLoading: boolean }) {
  const { t } = useTranslation();

  return (
    <section>
      <SectionHeading title={t("analytics.reportsSection")} description={t("analytics.reportsSectionDesc")} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.report")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <Skeleton className="h-32 rounded-lg" /> : <p className="text-sm leading-6 text-foreground">{data?.report.executiveSummary ?? t("analytics.reportLoading")}</p>}
            {data?.report.sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 text-xs font-semibold uppercase text-primary">{section.title}</h3>
                <div className="space-y-2">
                  {section.findings.map((finding) => (
                    <p key={finding} className="rounded-lg border border-border bg-surface p-3 text-sm leading-6 text-muted">{finding}</p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.dataQuality")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.contract.anomaliesDetected.length ? data.contract.anomaliesDetected : ["No invalid, incomplete, or inconsistent analytics detected."]).map((item) => (
              <p key={item} className="rounded-lg border border-border bg-surface p-3 text-sm leading-6 text-muted">{item}</p>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="mt-5">{data ? <DataTable title={t("analytics.campaignReports")} campaigns={data.campaigns} /> : <Skeleton className="h-64 rounded-lg" />}</div>
    </section>
  );
}

function SectionHeading({ description, title }: { description: string; title: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-60 place-items-center rounded-lg border border-dashed border-border bg-surface p-6 text-center">
      <p className="max-w-sm text-sm leading-6 text-muted">{label}</p>
    </div>
  );
}

function EmptyMini({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm leading-6 text-muted">{label}</p>;
}

function toneClass(tone: AnalyticsMetricCard["tone"]) {
  if (tone === "success") return "text-primary";
  if (tone === "warning") return "text-tertiary";
  if (tone === "danger") return "text-red-200";
  return "text-muted";
}
