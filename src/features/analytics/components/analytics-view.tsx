"use client";

import { AlertTriangle, Download, Eye, Heart, Lightbulb, MessageCircle, RefreshCw, Share2, Sparkles, Target, TrendingUp, AlertCircle, Percent, Activity, Bookmark, Zap, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { useAnalyticsMutation } from "@/features/analytics/hooks/use-analytics";
import type { AnalyticsFilterState, EngineAnalytics } from "@/features/analytics/types";

export function AnalyticsView() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AnalyticsFilterState>({
    url: "",
    brandName: "",
    industry: "",
  });

  const mutation = useAnalyticsMutation();
  const data = mutation.data?.[0];
  const isLoading = mutation.isPending;

  function updateFilter(key: keyof AnalyticsFilterState, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleAnalyze() {
    if (!filters.url || !filters.brandName || !filters.industry) return;
    mutation.mutate(filters);
  }

  function exportReport() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `marketly-post-report.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell
      title={
        <div className="flex items-center gap-3">
          {t("analytics.title")}
          <Badge className="font-normal border-primary/20 bg-primary/10 text-primary">
            <Zap className="size-3.5 me-1 inline-block" /> 5 Credits/Analysis
          </Badge>
        </div>
      }
      description={t("analytics.description")}
      actions={
        <>
          <Button variant="secondary" onClick={handleAnalyze} disabled={isLoading || !filters.url}>
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
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
        <AnalysisForm filters={filters} updateFilter={updateFilter} handleAnalyze={handleAnalyze} isLoading={isLoading} />

        {mutation.isError && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardHeader className="flex flex-row items-center gap-3">
              <AlertCircle className="size-5 text-red-500" />
              <CardTitle className="text-red-500">Analysis Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-400">{mutation.error.message || "An unexpected network error occurred."}</p>
            </CardContent>
          </Card>
        )}

        {isLoading || data ? (
          <AnalyticsResults data={data} isLoading={isLoading} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="size-8" />
            </div>
            <h3 className="text-xl font-semibold">Ready to Analyze</h3>
            <p className="mt-2 text-muted max-w-md">Enter a post URL, brand name, and industry in the form above to generate a comprehensive AI-powered analytics report.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function AnalysisForm({
  filters,
  updateFilter,
  handleAnalyze,
  isLoading,
}: {
  filters: AnalyticsFilterState;
  updateFilter: (key: keyof AnalyticsFilterState, value: string) => void;
  handleAnalyze: () => void;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Activity className="size-4" />
          </span>
          <div>
            <CardTitle>Post Analysis</CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted">Enter post details to retrieve live metrics and AI insights.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] items-end">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase text-muted">Post URL</span>
          <Input placeholder="https://..." value={filters.url} onChange={(e) => updateFilter("url", e.target.value)} disabled={isLoading} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase text-muted">Brand Name</span>
          <Input placeholder="e.g. Marketly" value={filters.brandName} onChange={(e) => updateFilter("brandName", e.target.value)} disabled={isLoading} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase text-muted">Industry</span>
          <Input placeholder="e.g. Technology" value={filters.industry} onChange={(e) => updateFilter("industry", e.target.value)} disabled={isLoading} />
        </label>
        <Button onClick={handleAnalyze} disabled={isLoading || !filters.url} className="w-full md:w-auto h-10 neon-gradient font-bold text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]">
          {isLoading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
          Analyze Post
        </Button>
      </CardContent>
    </Card>
  );
}

function KpiMetrics({ data }: { data: EngineAnalytics }) {
  // Gracefully fallback deeply nested changing schemas
  const views = data.engagementMetrics?.views ?? data.engagement?.views ?? data.views ?? 0;
  const likes = data.engagementMetrics?.likes ?? data.engagement?.likes ?? data.likes ?? 0;
  const comments = data.engagementMetrics?.comments ?? data.engagement?.comments ?? data.comments ?? 0;
  const shares = data.engagementMetrics?.shares ?? data.engagement?.shares ?? data.shares ?? 0;
  const saves = data.engagementMetrics?.saves ?? data.engagement?.saves ?? data.saves ?? 0;
  const engRate = data.engagementMetrics?.engagementRate ?? data.engagement?.engagementRate ?? data.analytics?.engagementRate ?? 0;
  const virality = data.engagementMetrics?.viralityScore ?? data.engagement?.viralityScore ?? data.analytics?.viralityScore ?? 0;

  return (
    <>
      <MetricCard label="Views" value={views} icon={Eye} format="number" />
      <MetricCard label="Likes" value={likes} icon={Heart} format="number" />
      <MetricCard label="Comments" value={comments} icon={MessageCircle} format="number" />
      <MetricCard label="Shares" value={shares} icon={Share2} format="number" />
      <MetricCard label="Saves" value={saves} icon={Bookmark} format="number" />
      <MetricCard label="Eng. Rate" value={engRate} icon={Percent} format="percent" />
      <MetricCard label="Virality Score" value={virality} icon={TrendingUp} format="number" />
    </>
  );
}

function MetricCard({ label, value, icon: Icon, format }: { label: string; value: number; icon: LucideIcon; format: "number" | "percent" }) {
  const displayValue = format === "percent" ? `${value.toFixed(1)}%` : value.toLocaleString();
  return (
    <Card className="min-h-36">
      <CardContent className="flex h-full flex-col justify-between gap-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-semibold uppercase text-muted">{label}</span>
          <span className="grid size-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-foreground">{displayValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ children, description, icon: Icon, title }: { children: React.ReactNode; description: string; icon: LucideIcon; title: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          </div>
          <Icon className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EngagementBreakdownChart({ data }: { data: EngineAnalytics }) {
  const likes = data.engagementMetrics?.likes ?? data.engagement?.likes ?? data.likes ?? 0;
  const comments = data.engagementMetrics?.comments ?? data.engagement?.comments ?? data.comments ?? 0;
  const shares = data.engagementMetrics?.shares ?? data.engagement?.shares ?? data.shares ?? 0;
  const saves = data.engagementMetrics?.saves ?? data.engagement?.saves ?? data.saves ?? 0;

  const chartData = [
    { name: "Likes", value: likes },
    { name: "Comments", value: comments },
    { name: "Shares", value: shares },
    { name: "Saves", value: saves },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ left: -18, right: 8, top: 15, bottom: 0 }}>
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--soft-green-surface)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip cursor={{ fill: "var(--soft-green-surface)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} />
        <Bar dataKey="value" fill="url(#barGlow)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function AudienceSentimentChart({ data }: { data: EngineAnalytics }) {
  const isPositive = data.sentiment === "positive" || data.contentAnalysis?.tone?.includes("positive");
  const isNegative = data.sentiment === "negative" || data.contentAnalysis?.tone?.includes("negative");
  
  const chartData = [
    { name: "Positive", value: isPositive ? 85 : isNegative ? 10 : 33, color: "#22c55e" },
    { name: "Neutral", value: isPositive ? 10 : isNegative ? 15 : 34, color: "#64748b" },
    { name: "Negative", value: isPositive ? 5 : isNegative ? 75 : 33, color: "#ef4444" },
  ];

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-3 mt-4">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted">{entry.name}</span>
            </div>
            <span className="font-semibold text-foreground">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, text, title }: { icon: LucideIcon; text?: string; title: string }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Icon className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {text ? <p className="text-sm leading-6 text-foreground">{text}</p> : <EmptyMini label={t("analytics.noInsight", { type: title.toLowerCase() })} />}
      </CardContent>
    </Card>
  );
}

function RecommendationInsight({ recommendation }: { recommendation?: string }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{t("analytics.recommendation")}</CardTitle>
          <Sparkles className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {recommendation ? <p className="text-sm leading-6 text-foreground">{recommendation}</p> : <EmptyMini label={t("analytics.noRecommendation")} />}
      </CardContent>
    </Card>
  );
}

function ReportsSection({ data, isLoading }: { data: EngineAnalytics | undefined; isLoading?: boolean }) {
  return (
    <section>
      <SectionHeading title="AI Post Report" description="Comprehensive analysis and content insights based on the post." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading || !data ? (
                <Skeleton className="h-32 rounded-lg" />
              ) : (
                <>
                  <p className="text-sm leading-6 text-foreground font-semibold">
                    Overall Impression: {data.performanceAssessment?.overallImpression || "Ready"}
                  </p>
                  
                  {/* Gracefully handle missing lists to prevent .map crashes */}
                  <ReportList title="Strengths" items={data.performanceAssessment?.strengths || data.performanceInsights?.strengths || data.performanceIndicators?.strengths || []} />
                  <ReportList title="Opportunities" items={data.performanceAssessment?.opportunities || data.performanceInsights?.opportunities || data.performanceIndicators?.opportunities || []} />
                  <ReportList title="Recommendations" items={data.performanceInsights?.recommendations || data.recommendations || []} />
                  <ReportList title="Product Highlights" items={data.contentAnalysis?.productHighlights || data.keyFeatures || []} />
                  <ReportList title="Key Themes" items={data.contentAnalysis?.keyThemes || []} />
                  <ReportList title="Emotional Triggers" items={data.contentAnalysis?.emotionalTriggers || []} />
                  <ReportList title="Image Text Extracted" items={data.mediaAnalysis?.imageTextExtracted || []} />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading || !data ? (
              <Skeleton className="h-64 rounded-lg" />
            ) : (
              <div className="space-y-4">
                <DetailRow label="Platform" value={data.platform} />
                <DetailRow label="Brand Name" value={data.brandName} />
                <DetailRow label="Media Type" value={data.mediaAnalysis?.mediaType || data.mediaType} />
                <DetailRow label="Media Count" value={data.mediaAnalysis?.mediaCount || data.mediaCount} />
                <DetailRow label="Target Audience" value={data.audienceInsights?.targetAudience || data.targetAudience} />
                <DetailRow label="Language" value={data.contentAnalysis?.language || data.language} />
                <DetailRow label="Tone" value={typeof data.contentAnalysis?.tone === 'string' ? data.contentAnalysis.tone : Array.isArray(data.tone) ? data.tone.join(', ') : data.tone} />
                <DetailRow label="Visual Focus" value={data.mediaAnalysis?.visualFocus} />
                
                {data.audienceInsights?.interests && data.audienceInsights.interests.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold uppercase text-muted block mb-2">Audience Interests</span>
                    <div className="flex flex-wrap gap-2">
                      {data.audienceInsights.interests.map(t => <Badge key={t}>{t}</Badge>)}
                    </div>
                  </div>
                )}

                {data.caption && (
                  <div>
                    <span className="text-xs font-semibold uppercase text-muted block mb-2">Caption</span>
                    <p className="rounded-lg border border-border bg-surface p-3 text-xs leading-5 text-muted">{data.caption}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ReportList({ title, items }: { title: string; items?: string[] | string }) {
  if (!items) return null;
  const itemsArray = Array.isArray(items) ? items : typeof items === "string" ? [items] : [];
  if (itemsArray.length === 0) return null;
  
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase text-primary">{title}</h3>
      <div className="space-y-2">
        {itemsArray.map((finding, idx) => (
          <p key={idx} className="rounded-lg border border-border bg-surface p-3 text-sm leading-6 text-muted">{finding}</p>
        ))}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: any }) {
  if (!value) return null;
  
  let displayValue = String(value);
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else {
      // If the API returns an object (e.g. {gender: 'men', language: 'Arabic'}), extract the values
      displayValue = Object.values(value).join(', ');
    }
  }

  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 gap-4">
      <span className="text-xs font-semibold uppercase text-muted flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right truncate" title={displayValue}>{displayValue}</span>
    </div>
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

function EmptyMini({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm leading-6 text-muted">{label}</p>;
}

export function AnalyticsResults({ data, isLoading }: { data?: EngineAnalytics; isLoading?: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      <section>
        <SectionHeading title="KPI Metrics" description="Core engagement signals from the post." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          {isLoading || !data
            ? Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-lg" />)
            : <KpiMetrics data={data} />
          }
        </div>
      </section>

      <section>
        <SectionHeading title="Engagement Breakdown" description="Distribution of engagement across different interactions." />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <ChartCard title="Engagement Distribution" description="Breakdown of likes, comments, and shares." icon={BarChart3}>
            {isLoading || !data ? <Skeleton className="h-[260px] w-full" /> : <EngagementBreakdownChart data={data} />}
          </ChartCard>
          <Card>
            <CardHeader>
              <CardTitle>Audience Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !data ? <Skeleton className="h-[260px] w-full" /> : <AudienceSentimentChart data={data} />}
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeading title={t("analytics.aiInsights")} description={t("analytics.aiInsightsDesc")} />
        <div className="grid gap-4 lg:grid-cols-2">
          {isLoading || !data ? (
            Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-lg" />)
          ) : (
            <>
              <InsightCard title="Opportunity" icon={Lightbulb} text={data.performanceAssessment?.opportunities?.[0] || data.performanceInsights?.opportunities?.[0]} />
              <InsightCard title="Trend" icon={TrendingUp} text={data.performanceAssessment?.strengths?.[0] || data.performanceInsights?.strengths?.[0]} />
            </>
          )}
        </div>
      </section>

      <ReportsSection data={data} isLoading={isLoading} />
    </>
  );
}
