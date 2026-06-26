"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { trendData } from "@/lib/constants/marketly";
import type { AnalyticsTrendPoint } from "@/features/analytics/types";

export function GrowthChart({ data }: { data?: typeof trendData }) {
  const chartData = data?.length ? data : [];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ left: -18, right: 10, top: 15, bottom: 0 }}>
        <defs>
          <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip cursor={{ stroke: "var(--primary)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} />
        <Line type="monotone" dataKey="value" stroke="url(#lineGlow)" strokeWidth={3} dot={{ r: 4, fill: "var(--foreground)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PerformanceChart({ data }: { data?: AnalyticsTrendPoint[] }) {
  const chartData = data?.length
    ? data
    : trendData.map((item) => ({
        clicks: item.value,
        conversions: item.conversions,
        cpc: 0,
        ctr: 0,
        engagementRate: 0,
        impressions: 0,
        period: item.name,
        revenue: 0,
        roi: 0,
        spend: 0,
      }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={chartData} margin={{ left: -18, right: 8, top: 15, bottom: 0 }}>
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--soft-green-surface)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip cursor={{ fill: "var(--soft-green-surface)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} />
        <Bar dataKey="conversions" fill="url(#barGlow)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsTrendChart({ data }: { data?: AnalyticsTrendPoint[] }) {
  const chartData = data?.length ? data : [];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ left: -18, right: 10, top: 15, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
        <Tooltip cursor={{ stroke: "var(--primary)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" }} />
        <Line type="monotone" dataKey="ctr" name="CTR" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: "var(--primary)" }} />
        <Line type="monotone" dataKey="engagementRate" name="Engagement" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 3, fill: "var(--secondary)" }} />
        <Line type="monotone" dataKey="roi" name="ROI" stroke="var(--tertiary)" strokeWidth={3} dot={{ r: 3, fill: "var(--tertiary)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
