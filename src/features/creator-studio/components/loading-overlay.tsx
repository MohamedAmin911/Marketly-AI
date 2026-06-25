"use client";

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-background/72 backdrop-blur-md">
      <div className="w-full max-w-sm px-6 text-center">
        <div className="mx-auto mb-6 h-36 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="h-full w-full shimmer" />
        </div>
        <p className="font-display text-xl font-semibold text-foreground">Building the commercial frame</p>
        <p className="mt-2 text-sm leading-6 text-muted">Preserving the reference scene while integrating your product with natural light, shadows, and reflections.</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full w-2/3 rounded-full neon-gradient shimmer" />
        </div>
      </div>
    </div>
  );
}
