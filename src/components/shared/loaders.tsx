import { Skeleton } from "@/components/ui/skeleton";

export function PanelSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-lg" />
      ))}
    </div>
  );
}
