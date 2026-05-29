import { Sparkles } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-lg border border-primary/35 bg-primary/10 text-primary shadow-[0_0_22px_rgba(114,255,95,0.2)]">
        <Sparkles className="size-4" />
      </div>
      <div>
        <p className="terminal-title text-base font-bold leading-none text-white">Marketly AI</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-primary/75">AI Growth Terminal</p>
      </div>
    </div>
  );
}
