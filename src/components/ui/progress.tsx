import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full border border-primary/10 bg-black/30", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="neon-gradient h-full rounded-full shadow-[0_0_18px_rgba(114,255,95,0.45)] transition-all duration-500" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}
