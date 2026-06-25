import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full border border-border bg-surface", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="neon-gradient h-full rounded-full shadow-[var(--shadow-glow-value)] transition-all duration-500" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}
