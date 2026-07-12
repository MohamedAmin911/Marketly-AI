"use client";

import { Competitor } from "@/types/viral-engine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "./copy-button";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CompetitorTableProps {
  competitors: Competitor[];
}

export function CompetitorTable({ competitors }: CompetitorTableProps) {
  const { t } = useTranslation();
  if (!competitors || competitors.length === 0) return null;

  const isStringArray = typeof competitors[0] === 'string';

  if (isStringArray) {
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {competitors.map((comp, idx) => (
          <div key={idx} className="flex gap-4 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 relative group cursor-default">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
              <span className="text-xs font-bold">{idx + 1}</span>
            </span>
            <div className="flex-1 pe-6 pt-1">
              <p className="text-sm leading-relaxed text-foreground/90 font-medium">{comp}</p>
            </div>
            <CopyButton data={comp} className="absolute end-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-primary/10">
            <TableHead className="font-semibold text-primary/80">{t("viralEngine.table.name")}</TableHead>
            <TableHead className="font-semibold text-primary/80">{t("viralEngine.table.platform")}</TableHead>
            <TableHead className="font-semibold text-primary/80">{t("viralEngine.table.followers")}</TableHead>
            <TableHead className="font-semibold text-primary/80">{t("viralEngine.table.engagement")}</TableHead>
            <TableHead className="font-semibold text-primary/80">{t("viralEngine.table.keyInsight")}</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitors.map((comp, idx) => {
            if (typeof comp === 'string') return null; // safety
            const reasonOrInsight = comp.reason || comp.insight || "-";
            return (
              <TableRow key={comp.id || idx} className="group hover:bg-primary/[0.05] border-primary/10 transition-colors">
                <TableCell className="font-semibold text-foreground">{comp.name || "-"}</TableCell>
                <TableCell>
                  {comp.platform ? (
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-mono text-[10px]">
                      {comp.platform}
                    </Badge>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{comp.followers || "-"}</TableCell>
                <TableCell>
                  <span className="text-emerald-500 font-bold font-mono text-xs">{comp.engagement || "-"}</span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate" title={reasonOrInsight}>
                  {reasonOrInsight}
                </TableCell>
                <TableCell>
                  <CopyButton data={comp} className="opacity-0 group-hover:opacity-100" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
