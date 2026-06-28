"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Activity, Bot } from "lucide-react";

async function fetchAdminDashboard() {
  const res = await fetch("/api/admin/dashboard", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  const data = await res.json();
  return data.data ?? data;
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: fetchAdminDashboard,
  });

  if (isLoading) return <div className="p-8 text-muted">Loading dashboard metrics...</div>;
  if (!data) return <div className="p-8 text-destructive">Failed to load metrics. Ensure you have admin access.</div>;

  const kpis = [
    { title: "Total Users", value: data.totalUsers, icon: Users, desc: `${data.activeUsers} active` },
    { title: "Premium Subs", value: data.premiumUsers, icon: CreditCard, desc: `${data.freeUsers} free users` },
    { title: "Credits Consumed", value: data.creditsConsumed, icon: Activity, desc: "Across all accounts" },
    { title: "AI Requests", value: data.aiRequests, icon: Bot, desc: "Assistant messages" },
  ];

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted mt-1">Platform overview and health metrics.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted">{kpi.title}</CardTitle>
              <kpi.icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <p className="text-xs text-muted mt-1">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
