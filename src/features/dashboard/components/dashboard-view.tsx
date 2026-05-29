"use client";

import { FolderKanban, Gauge, MoreHorizontal, PieChart } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { ResponsiveGrid } from "@/components/layout/responsive-grid";
import { ErrorState } from "@/components/shared/error-state";
import { GrowthChart } from "@/components/shared/lazy-charts";
import { PanelSkeleton } from "@/components/shared/loaders";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuickActionsCard } from "@/features/dashboard/components/quick-actions-card";
import { RecentGenerationsCard } from "@/features/dashboard/components/recent-generations-card";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

const metricIcons = [FolderKanban, Gauge, PieChart, FolderKanban];

export function DashboardView() {
  const { data, isLoading, isError } = useDashboard();
  const activityCount = Number(data?.metrics[1]?.value.replace(/,/g, "") ?? 0);
  const activityProgress = Math.min(activityCount * 10, 100);

  return (
    <PageShell title="Dashboard Overview" description="Welcome back. Here is your AI generation and campaign performance.">
      {isLoading ? <PanelSkeleton /> : null}
      {isError ? <ErrorState message="Dashboard data could not be loaded. Retry from the browser refresh control." /> : null}
      {data ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-5">
            <ResponsiveGrid columns="metrics">
              {data.metrics.map((metric, index) => (
                <MetricCard key={metric.label} metric={metric} icon={metricIcons[index]} />
              ))}
            </ResponsiveGrid>
            <Card>
              <CardHeader>
                <CardTitle>Growth Trajectory</CardTitle>
                <div className="flex gap-2" aria-label="Chart range">
                  {["7D", "30D", "90D"].map((item) => (
                    <Button key={item} variant={item === "30D" ? "default" : "secondary"} size="sm" className="h-8 min-h-8 px-3" type="button">
                      {item}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <GrowthChart data={data.growthTrend} />
              </CardContent>
            </Card>
            <RecentGenerationsCard items={data.recentGenerations} />
          </div>

          <aside className="space-y-5" aria-label="Dashboard actions and goals">
            <QuickActionsCard />
            <Card>
              <CardHeader>
                <CardTitle>Workspace Activity</CardTitle>
                <MoreHorizontal className="size-4 text-muted" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-end justify-between">
                  <span className="font-display text-3xl font-semibold">{activityCount}</span>
                  <span className="font-mono text-xs text-primary">{activityProgress}%</span>
                </div>
                <Progress value={activityProgress} />
                <p className="mt-4 text-sm leading-6 text-muted">Progress is based on real saved assets, campaigns, storyboards, and videos for this account.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </PageShell>
  );
}
