import type { MarketingContext, Recommendation } from "@/server/marketing-intelligence/types";

const forbiddenClaims = ["guaranteed", "risk-free", "best ever"];

export function generateRecommendations(context: MarketingContext): Recommendation[] {
  const { analytics, brand, campaigns, conflicts, incompleteData, memory } = context;
  const recommendations: Recommendation[] = [];

  if (analytics.ctr < 3) {
    recommendations.push({
      action: `Create five ${brand.tone} hook variants for ${brand.audience} and route 30% of traffic to the two clearest pain-point angles.`,
      confidence: analytics.impressions > 5000 ? 0.82 : 0.64,
      evidence: `CTR is ${analytics.ctr}% from ${analytics.impressions.toLocaleString()} impressions`,
      priority: "high",
      rationale: "Low attention efficiency usually means the first claim, visual, or audience match needs repair before budget changes matter.",
      title: "Refresh hooks before scaling",
    });
  }

  if (analytics.roi >= 150 && analytics.conversions >= 100) {
    recommendations.push({
      action: "Increase budget by 15% on the highest-converting campaign and cap daily changes to keep learning stable.",
      confidence: 0.78,
      evidence: `${analytics.roi}% ROI with ${analytics.conversions.toLocaleString()} conversions`,
      priority: "high",
      rationale: "ROI and conversion volume are high enough to support controlled scaling without overreacting to a single metric.",
      title: "Scale proven conversion pockets",
    });
  }

  if (analytics.cpc > 0 && analytics.ctr >= 3 && analytics.roi < 100) {
    recommendations.push({
      action: "Keep the winning click hooks, but narrow targeting and add negative segments until CPC falls below the campaign average.",
      confidence: 0.74,
      evidence: `${analytics.ctr}% CTR, $${analytics.cpc.toFixed(2)} CPC, ${analytics.roi}% ROI`,
      priority: "high",
      rationale: "Strong clicks with weak returns usually means the audience or post-click promise is too broad.",
      title: "Reduce CPC before adding spend",
    });
  }

  if (analytics.engagementRate >= 8 && analytics.conversions < 50) {
    recommendations.push({
      action: "Turn the highest-engagement creative into a conversion-focused retargeting sequence with stronger proof and one direct CTA.",
      confidence: 0.69,
      evidence: `${analytics.engagementRate}% engagement rate with ${analytics.conversions.toLocaleString()} conversions`,
      priority: "medium",
      rationale: "Engagement is useful only when it feeds the next measurable step in the funnel.",
      title: "Convert engagement into retargeting",
    });
  }

  if (campaigns.length > 1) {
    recommendations.push({
      action: `Compare ${campaigns.slice(0, 3).join(", ")} by conversion intent and pause audiences with weak click-to-conversion depth.`,
      confidence: 0.72,
      evidence: `${campaigns.length} active campaign signals available`,
      priority: "medium",
      rationale: "Campaign-level allocation should follow conversion quality, not only impressions or clicks.",
      title: "Rebalance campaign allocation",
    });
  }

  if (analytics.recommendations.length) {
    recommendations.push({
      action: analytics.recommendations[0],
      confidence: 0.68,
      evidence: "Existing analytics recommendation supplied by measurement layer",
      priority: "medium",
      rationale: "Validated upstream recommendations are retained when they do not conflict with metric guardrails.",
      title: "Carry forward validated recommendation",
    });
  }

  if (memory.successfulCampaigns.length) {
    recommendations.push({
      action: `Adapt the strongest pattern from ${memory.successfulCampaigns[0]} into one new ${brand.industry} acquisition test.`,
      confidence: 0.61,
      evidence: `AI memory successful campaign: ${memory.successfulCampaigns[0]}`,
      priority: "medium",
      rationale: "Memory can personalize direction, but it is weighted below current analytics evidence.",
      title: "Personalize from historical wins",
    });
  }

  if (conflicts.length || incompleteData.length || analytics.anomaliesDetected.length) {
    recommendations.push({
      action: "Lock automated budget changes until tracking fields are reconciled, then regenerate recommendations from clean metrics.",
      confidence: 0.9,
      evidence: [...conflicts, ...incompleteData, ...analytics.anomaliesDetected].slice(0, 2).join("; "),
      priority: "high",
      rationale: "Conflicting or incomplete metrics can create hallucinated recommendations if the system treats them as reliable facts.",
      title: "Repair measurement before automation",
    });
  }

  return guardRecommendations(recommendations);
}

function guardRecommendations(recommendations: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();

  return recommendations
    .filter((recommendation) => recommendation.evidence.trim().length > 0)
    .filter((recommendation) => !forbiddenClaims.some((claim) => `${recommendation.title} ${recommendation.action}`.toLowerCase().includes(claim)))
    .filter((recommendation) => {
      const key = recommendation.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}
