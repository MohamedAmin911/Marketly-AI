"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CreditCard, Activity, Loader2 } from "lucide-react";

async function fetchAdminAnalytics() {
  const res = await fetch("/api/admin/analytics", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const data = await res.json();
  return data.data ?? data;
}

type AdminInsight = {
  name: string;
  value: number;
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: fetchAdminAnalytics,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="p-8 text-muted flex items-center"><Loader2 className="mr-2 animate-spin" /> Loading dashboard...</div>;
  if (!data) return <div className="p-8 text-destructive">Failed to load metrics. Ensure you have admin access.</div>;

  const kpis = [
    { title: "Total Users", value: data.kpis.totalUsers, icon: Users, desc: "All registered accounts" },
    { title: "Active Subscriptions", value: data.kpis.activeSubscriptions, icon: CreditCard, desc: "Paid plans active" },
    { title: "Online Now", value: data.kpis.onlineUsers, icon: Activity, desc: "Active in last 5 mins", highlight: true },
  ];

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted mt-1">Real-time platform overview and management tools.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {kpis.map(kpi => (
          <Card key={kpi.title} className={kpi.highlight ? "border-primary/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted">{kpi.title}</CardTitle>
              <kpi.icon className={`size-4 ${kpi.highlight ? "text-primary animate-pulse" : "text-muted"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
              <p className="text-xs text-muted mt-1">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generation Insights (30 Days)</CardTitle>
            <CardDescription>Total platform usage across all users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.insights.map((insight: AdminInsight) => (
                <div key={insight.name} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-muted">{insight.name}</span>
                  <span className="font-semibold">{insight.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
