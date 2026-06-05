import { buildMemoryInjection } from "@/server/marketing-intelligence/context-injection-service";
import type { AnalyticsInsight, MarketingContext } from "@/server/marketing-intelligence/types";

export function generateAnalyticsInsights(context: MarketingContext): AnalyticsInsight[] {
  const { analytics, brand, conflicts, incompleteData } = context;
  const insights: AnalyticsInsight[] = [];

  if (analytics.ctr >= 4) {
    insights.push({
      description: "Click-through rate is strong enough to justify creative variant expansion before increasing budget.",
      evidence: `${analytics.ctr}% CTR across ${analytics.impressions.toLocaleString()} impressions`,
      severity: "medium",
      title: "CTR is above expansion threshold",
      type: "opportunity",
    });
  } else {
    insights.push({
      description: "The offer is not earning enough initial attention. Refresh hooks and first-screen value proof before scaling spend.",
      evidence: `${analytics.ctr}% CTR across ${analytics.impressions.toLocaleString()} impressions`,
      severity: analytics.ctr < 1.5 ? "high" : "medium",
      title: "Attention efficiency needs work",
      type: "risk",
    });
  }

  if (analytics.roi < 100) {
    insights.push({
      description: "Returns are below a healthy reinvestment range. Shift budget toward campaigns with proven conversion intent.",
      evidence: `${analytics.roi}% ROI with ${analytics.conversions.toLocaleString()} conversions`,
      severity: analytics.roi < 0 ? "high" : "medium",
      title: "ROI pressure detected",
      type: "anomaly",
    });
  } else {
    insights.push({
      description: "Return profile supports measured scaling, especially in channels already showing conversion depth.",
      evidence: `${analytics.roi}% ROI with ${analytics.conversions.toLocaleString()} conversions`,
      severity: "low",
      title: "Profitable performance window",
      type: "trend",
    });
  }

  if (analytics.cpc > 0 && analytics.roi < 120) {
    insights.push({
      description: "Cost per click is absorbing margin faster than the conversion path can recover it.",
      evidence: `$${analytics.cpc.toFixed(2)} CPC with ${analytics.roi}% ROI`,
      severity: analytics.roi < 50 ? "high" : "medium",
      title: "CPC efficiency needs a ceiling",
      type: "risk",
    });
  }

  if (analytics.engagementRate >= 8 && analytics.ctr < 3) {
    insights.push({
      description: "People are interacting with the content but not clicking through, so the CTA and landing promise need tighter alignment.",
      evidence: `${analytics.engagementRate}% engagement rate with ${analytics.ctr}% CTR`,
      severity: "medium",
      title: "Engagement is not becoming traffic",
      type: "opportunity",
    });
  }

  analytics.trends.slice(0, 3).forEach((trend) => {
    insights.push({
      description: `This trend should shape ${brand.name}'s next creative and targeting tests.`,
      evidence: trend,
      severity: "medium",
      title: "Market trend signal",
      type: "trend",
    });
  });

  conflicts.slice(0, 2).forEach((conflict) => {
    insights.push({
      description: "Resolve the metric mismatch before using this record for automated budget decisions.",
      evidence: conflict,
      severity: "high",
      title: "Conflicting metric guardrail",
      type: "anomaly",
    });
  });

  analytics.anomaliesDetected.slice(0, 2).forEach((anomaly) => {
    insights.push({
      description: "Treat this campaign as measurement-risky until the source report is reconciled.",
      evidence: anomaly,
      severity: "high",
      title: "Analytics anomaly detected",
      type: "anomaly",
    });
  });

  if (incompleteData.length) {
    insights.push({
      description: "The system generated conservative recommendations because some measurement fields were absent.",
      evidence: incompleteData.slice(0, 3).join("; "),
      severity: "medium",
      title: "Incomplete data fallback active",
      type: "risk",
    });
  }

  const memorySignals = buildMemoryInjection(context.memory);
  if (memorySignals.length) {
    insights.push({
      description: "Assistant personalization is available, but memory is treated as preference guidance rather than factual evidence.",
      evidence: memorySignals.slice(0, 2).join("; "),
      severity: "low",
      title: "AI memory injected",
      type: "opportunity",
    });
  }

  return dedupeInsights(insights).slice(0, 8);
}

function dedupeInsights(insights: AnalyticsInsight[]): AnalyticsInsight[] {
  const seen = new Set<string>();

  return insights.filter((insight) => {
    const key = `${insight.title}:${insight.evidence}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
