import { z } from "zod";

const analyticsEventSchema = z.object({
  campaignId: z.string().uuid().optional(),
  event: z.enum([
    "analytics.report.generated",
    "asset.exported",
    "asset.generated",
    "campaign.clicked",
    "campaign.converted",
    "campaign.created",
    "campaign.impression",
    "dashboard.viewed",
    "engagement.recorded",
  ]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.string().datetime().default(() => new Date().toISOString()),
});

export const analyticsEventsRequestSchema = z.object({
  events: z.array(analyticsEventSchema).min(1).max(100),
});

export const analyticsQuerySchema = z.object({
  campaign: z.string().trim().max(120).default("all"),
  channel: z.string().trim().max(80).default("all"),
  from: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  range: z.enum(["24h", "7d", "30d", "90d", "all"]).default("30d"),
  status: z.string().trim().max(40).default("all"),
  to: z.string().datetime().optional(),
});

export type AnalyticsEventsRequest = z.infer<typeof analyticsEventsRequestSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
