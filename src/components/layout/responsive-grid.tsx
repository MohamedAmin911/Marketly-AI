import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ResponsiveGrid({
  children,
  className,
  columns = "cards",
}: {
  children: ReactNode;
  className?: string;
  columns?: "cards" | "metrics" | "workspace";
}) {
  return (
    <div
      className={cn(
        "grid gap-5",
        columns === "cards" && "sm:grid-cols-2 xl:grid-cols-3",
        columns === "metrics" && "md:grid-cols-3",
        columns === "workspace" && "xl:grid-cols-[26rem_1fr]",
        className,
      )}
    >
      {children}
    </div>
  );
}

