"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyticsCampaignRow } from "@/features/analytics/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function DataTable({ campaigns, rows, title }: { campaigns?: AnalyticsCampaignRow[]; rows?: string[][]; title: string }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("analytics.campaignName")}</TableHead>
              <TableHead>{t("analytics.status")}</TableHead>
              <TableHead>{t("analytics.channel")}</TableHead>
              <TableHead>{t("analytics.spend")}</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>CPC</TableHead>
              <TableHead>{t("analytics.conversionsCount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns
              ? campaigns.map((campaign) => (
                  <TableRow key={campaign.campaignId}>
                    <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                    <TableCell>
                      <Badge tone={campaign.status === "active" ? "success" : campaign.status === "paused" ? "warning" : "default"}>{translateStatus(campaign.status, t)}</Badge>
                    </TableCell>
                    <TableCell>{campaign.channel}</TableCell>
                    <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell>{campaign.ctr}%</TableCell>
                    <TableCell>{formatCurrency(campaign.cpc)}</TableCell>
                    <TableCell>{campaign.conversions.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              : rows?.map((row) => (
                  <TableRow key={row[0]}>
                    <TableCell className="font-medium">{row[0]}</TableCell>
                    <TableCell>
                      <Badge tone={row[1] === "Active" ? "success" : row[1] === "Paused" ? "warning" : "default"}>{translateStatus(row[1], t)}</Badge>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{row[2]}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{row[3]}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function translateStatus(status: string, t: ReturnType<typeof useTranslation>["t"]) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return t("common.active");
  if (normalized === "paused") return t("common.paused");
  if (normalized === "completed") return t("common.completed");
  if (normalized === "pending") return t("common.pending");
  if (normalized === "draft") return t("common.draft");
  if (normalized === "failed") return t("common.failed");
  return status;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
