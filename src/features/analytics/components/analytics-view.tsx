"use client";

import { Activity, AlertTriangle, Banknote, BarChart3, Download, Eye, MousePointerClick, Percent, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { DataTable } from "@/components/shared/data-table";
import { AnalyticsTrendChart, PerformanceChart } from "@/components/shared/lazy-charts";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useAnalyticsIntelligence } from "@/features/analytics/hooks/use-analytics";
import { defaultAnalyticsFilters } from "@/features/analytics/services";
import type { AnalyticsFilterState, AnalyticsMetricCard } from "@/features/analytics/types";
import { createRange } from "@/lib/utils";
import type { Metric } from "@/types/common";

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

export function AnalyticsView() {
  const [filters, setFilters] = useState<AnalyticsFilterState>(defaultAnalyticsFilters);
  const { data, isFetching, isLoading, refetch } = useAnalytics(filters);
  const intelligence = useAnalyticsIntelligence();
  const metricCards = useMemo(() => data?.metrics.map((metric) => ({ icon: metricIcons[metric.key], metric: toMetric(metric), key: metric.key })), [data?.metrics]);
  const visibleRecommendations = useMemo(() => (data?.recommendations ?? []).slice(0, 3), [data?.recommendations]);
  const visibleInsights = useMemo(() => intelligence.data?.insights.slice(0, 4) ?? [], [intelligence.data?.insights]);

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
      title="Analytics Overview"
      description="Track clicks, conversions, CTR, ROI, CPC, engagement rate, reports, anomalies, and AI-backed recommendations from one reporting contract."
      actions={
        <>
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={exportReport} disabled={!data}>
            <Download className="size-4" />
            Export Report
          </Button>
        </>
      }
    >
      <Card className="mb-5">
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Select value={filters.range} onChange={(event) => updateFilter("range", event.target.value)}>
            {ranges.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </Select>
          <Select value={filters.channel} onChange={(event) => updateFilter("channel", event.target.value)}>
            <option value="all">All channels</option>
            {data?.filterOptions.channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </Select>
          <Select value={filters.campaign} onChange={(event) => updateFilter("campaign", event.target.value)}>
            <option value="all">All campaigns</option>
            {data?.filterOptions.campaigns.map((campaign) => <option key={campaign} value={campaign}>{campaign}</option>)}
          </Select>
          <Select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            <option value="all">All statuses</option>
            {data?.filterOptions.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? createRange(7).map((index) => <Skeleton key={index} className="h-32 rounded-lg" />)
          : metricCards?.map(({ icon, key, metric }) => (
              <MetricCard key={key} metric={metric} icon={icon} />
            ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Trend Analysis</CardTitle>
              <p className="mt-1 text-sm leading-6 text-muted">CTR, ROI, and engagement rate across the selected report window.</p>
            </div>
            <BarChart3 className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <AnalyticsTrendChart data={data?.trends} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading
              ? createRange(4).map((index) => <Skeleton key={index} className="h-8" />)
              : data?.sources.map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="text-muted">{value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={data?.trends} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Data Quality</CardTitle>
              <p className="mt-1 text-sm leading-6 text-muted">Division-by-zero and inconsistent reports are converted into guardrails.</p>
            </div>
            <AlertTriangle className="size-5 text-tertiary" />
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.contract.anomaliesDetected.length ? data.contract.anomaliesDetected : ["No invalid, incomplete, or inconsistent analytics detected."]).map((item) => (
              <p key={item} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-muted">{item}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {visibleRecommendations.map((recommendation) => (
          <Card key={recommendation.title}>
            <CardHeader>
              <div>
                <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                <p className="mt-1 text-sm leading-6 text-muted">{recommendation.rationale}</p>
              </div>
              <Badge tone={recommendation.priority === "high" ? "danger" : recommendation.priority === "medium" ? "warning" : "success"}>{Math.round(recommendation.confidence * 100)}%</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-foreground">{recommendation.action}</p>
              <p className="mt-3 font-mono text-[11px] leading-5 text-primary">{recommendation.evidence}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>AI Recommendation Insights</CardTitle>
              <p className="mt-1 text-sm leading-6 text-muted">Generated from the analytics contract and marketing intelligence guardrails.</p>
            </div>
            <Sparkles className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {intelligence.isLoading
              ? createRange(4).map((index) => <Skeleton key={index} className="h-28 rounded-lg" />)
              : visibleInsights.map((insight) => (
                  <div key={`${insight.title}-${insight.evidence}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-white">{insight.title}</h3>
                      <Badge tone={insight.severity === "high" ? "danger" : insight.severity === "medium" ? "warning" : "success"}>{insight.type}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{insight.description}</p>
                    <p className="mt-3 font-mono text-[11px] leading-5 text-primary">{insight.evidence}</p>
                  </div>
                ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-foreground">{data?.report.executiveSummary ?? "Report is loading."}</p>
            {data?.report.sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">{section.title}</h3>
                <div className="space-y-2">
                  {section.findings.map((finding) => (
                    <p key={finding} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-muted">{finding}</p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5">{data ? <DataTable title="Campaign Reports" campaigns={data.campaigns} /> : <Skeleton className="h-64 rounded-lg" />}</div>
    </PageShell>
  );
}

function toMetric(metric: AnalyticsMetricCard): Metric {
  const direction = metric.delta >= 0 ? "+" : "";

  return {
    delta: `${direction}${metric.delta}% vs previous period`,
    label: metric.label,
    tone: metric.tone,
    value: metric.value,
  };
}
