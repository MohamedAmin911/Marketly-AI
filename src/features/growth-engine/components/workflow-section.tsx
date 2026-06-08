import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SectionStatus } from "@/features/growth-engine/types";
import { cn } from "@/lib/utils";

export function WorkflowSection({
  children,
  description,
  emptyDescription,
  emptyTitle,
  error,
  loadingRows = 4,
  status,
  title,
}: {
  children: ReactNode;
  description?: string;
  emptyDescription: string;
  emptyTitle: string;
  error?: string;
  loadingRows?: number;
  status: SectionStatus;
  title: string;
}) {
  return (
    <Card className="min-h-[260px]">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <StatusPill status={status} />
      </CardHeader>
      <CardContent>
        {status === "loading" ? <SectionSkeleton rows={loadingRows} /> : null}
        {status === "error" ? <ErrorState message={error ?? "This section could not be generated."} /> : null}
        {status === "empty" ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}
        {status === "success" ? children : null}
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: SectionStatus }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 font-mono text-[10px] font-bold uppercase",
        status === "success" && "border-primary/30 bg-primary/10 text-primary",
        status === "loading" && "border-tertiary/30 bg-tertiary/10 text-tertiary",
        status === "error" && "border-red-300/25 bg-red-300/10 text-red-200",
        status === "empty" && "border-white/10 bg-white/[0.03] text-muted",
      )}
    >
      {status}
    </span>
  );
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-2/3 rounded-md" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 rounded-lg" />
      ))}
    </div>
  );
}
