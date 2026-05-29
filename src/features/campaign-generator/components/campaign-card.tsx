import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SocialPostConcept } from "@/features/campaign-generator/types";

export function CampaignCard({ onCopy, post }: { onCopy: () => void; post: SocialPostConcept }) {
  return (
    <article className="group rounded-2xl border border-primary/10 bg-white/[0.035] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur transition duration-300 hover:border-primary/45 hover:bg-primary/[0.035] hover:shadow-glow">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Post Concept</p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-white">{post.title}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-muted">{post.platform}</span>
      </div>
      <div className="space-y-4">
        <section>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">Social Caption</p>
          <p className="text-sm leading-6 text-white/78">{post.caption}</p>
        </section>
        <section>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">Visual Direction</p>
          <p className="text-sm leading-6 text-muted">{post.visualDirection}</p>
        </section>
      </div>
      <Button variant="secondary" size="sm" type="button" onClick={onCopy} className="mt-5">
        <Copy className="size-3" />
        Copy
      </Button>
    </article>
  );
}
