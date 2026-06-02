import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyticsCampaignRow } from "@/features/analytics/types";

export function DataTable({ campaigns, rows, title }: { campaigns?: AnalyticsCampaignRow[]; rows?: string[][]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>CPC</TableHead>
              <TableHead>Conversions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns
              ? campaigns.map((campaign) => (
                  <TableRow key={campaign.campaignId}>
                    <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                    <TableCell>
                      <Badge tone={campaign.status === "active" ? "success" : campaign.status === "paused" ? "warning" : "default"}>{campaign.status}</Badge>
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
                      <Badge tone={row[1] === "Active" ? "success" : row[1] === "Paused" ? "warning" : "default"}>{row[1]}</Badge>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
