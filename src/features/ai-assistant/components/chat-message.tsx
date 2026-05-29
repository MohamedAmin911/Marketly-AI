import { Bot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ChatMessage as ChatMessageType } from "@/features/ai-assistant/types/chat";
import { cn } from "@/lib/utils";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  return (
    <article className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[46rem] gap-3", isUser && "flex-row-reverse")}>
        <div className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/15 text-primary" aria-hidden="true">
          {isUser ? <span className="text-xs font-bold">You</span> : <Bot className="size-4" />}
        </div>
        <Card className={cn("p-4", isUser && "bg-white/[0.08]")}>
          <p className="text-sm leading-6 text-foreground">{message.content}</p>
          {message.card ? (
            <div className="mt-4 rounded-lg border border-primary/15 bg-black/20 p-4">
              <h3 className="font-display text-xl font-semibold text-white">{message.card.title}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {message.card.metrics.map((metric, index) => (
                  <div key={metric} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <Badge tone={index === 1 ? "warning" : "default"}>{index === 1 ? "Budget shift" : "-12% ROI"}</Badge>
                    <p className="mt-2 text-xs leading-5 text-muted">{metric}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </article>
  );
}
