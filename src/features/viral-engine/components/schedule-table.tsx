"use client";

import { CopyButton } from "./copy-button";
import { PostingSchedule } from "@/types/viral-engine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ScheduleTableProps {
  schedule: PostingSchedule[];
}

export function ScheduleTable({ schedule }: ScheduleTableProps) {
  const { t } = useTranslation();
  if (!schedule || schedule.length === 0) return null;

  const isStringArray = typeof schedule[0] === 'string';

  if (isStringArray) {
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {(schedule as unknown as string[]).map((item, idx) => (
          <div key={idx} className="flex gap-4 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 relative group cursor-default">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <Calendar className="size-4 text-primary" />
            </span>
            <div className="flex-1 pe-6 pt-1">
              <p className="text-sm leading-relaxed text-foreground/90 font-medium">{item}</p>
            </div>
            <CopyButton data={item} className="absolute end-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <TableHead className="w-[120px] font-semibold text-primary/80">{t("viralEngine.table.day")}</TableHead>
            <TableHead className="w-[120px] font-semibold text-primary/80">{t("viralEngine.table.time")}</TableHead>
            <TableHead className="font-semibold text-primary/80">{t("viralEngine.table.platform")}</TableHead>
            <TableHead className="font-semibold text-primary/80">{t("viralEngine.table.contentType")}</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((item, i) => {
            if (typeof item === 'string') return null;

            return (
              <TableRow key={i} className="group hover:bg-primary/[0.05] border-primary/10 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-primary/70 shrink-0" />
                    <span className="text-foreground">{item.day}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                    <Clock className="size-3.5 text-primary/70" />
                    {item.time}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge tone="success" className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-mono text-[10px]">{item.platform}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{item.contentType}</TableCell>
                <TableCell>
                  <CopyButton data={item} className="opacity-0 group-hover:opacity-100" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
