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
            <stop offset="0%" stopColor="#72ff5f" />
            <stop offset="100%" stopColor="#d7ff7a" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(114,255,95,0.08)" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8aa68c", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8aa68c", fontSize: 11 }} />
        <Tooltip cursor={{ stroke: "rgba(114,255,95,0.25)" }} contentStyle={{ background: "#061208", border: "1px solid rgba(114,255,95,.18)", borderRadius: 8, color: "#e9ffe6" }} />
        <Line type="monotone" dataKey="value" stroke="url(#lineGlow)" strokeWidth={3} dot={{ r: 4, fill: "#fff" }} />
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
            <stop offset="0%" stopColor="#72ff5f" />
            <stop offset="100%" stopColor="rgba(114,255,95,.18)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(114,255,95,0.08)" vertical={false} />
        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#8aa68c", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8aa68c", fontSize: 11 }} />
        <Tooltip cursor={{ fill: "rgba(114,255,95,0.04)" }} contentStyle={{ background: "#061208", border: "1px solid rgba(114,255,95,.18)", borderRadius: 8, color: "#e9ffe6" }} />
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
        <CartesianGrid stroke="rgba(114,255,95,0.08)" vertical={false} />
        <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#8aa68c", fontSize: 11 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8aa68c", fontSize: 11 }} />
        <Tooltip cursor={{ stroke: "rgba(114,255,95,0.25)" }} contentStyle={{ background: "#061208", border: "1px solid rgba(114,255,95,.18)", borderRadius: 8, color: "#e9ffe6" }} />
        <Line type="monotone" dataKey="ctr" name="CTR" stroke="#62ff9a" strokeWidth={3} dot={{ r: 3, fill: "#62ff9a" }} />
        <Line type="monotone" dataKey="engagementRate" name="Engagement" stroke="#d7ff7a" strokeWidth={3} dot={{ r: 3, fill: "#d7ff7a" }} />
        <Line type="monotone" dataKey="roi" name="ROI" stroke="#72ff5f" strokeWidth={3} dot={{ r: 3, fill: "#72ff5f" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
