"use client";
import { Bot, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ChatMessage as ChatMessageType } from "@/features/ai-assistant/types/chat";
import { cn } from "@/lib/utils";

export function ChatMessage({ message, onSpeak }: { message: ChatMessageType, onSpeak?: (text: string) => Promise<void> }) {
  const isUser = message.role === "user";
  const isImage = message.attachment?.mimeType.startsWith("image/");

  return (
    <article className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[46rem] gap-3", isUser && "flex-row-reverse")}>
        <div className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/15 text-primary" aria-hidden="true">
          {isUser ? <span className="text-xs font-bold">You</span> : <Bot className="size-4" />}
        </div>
        <Card className={cn("p-4", isUser && "bg-white/[0.08]")}>
          {message.attachment ? (
            <div className="mb-3">
              {isImage ? (
                <img src={message.attachment.dataUrl} alt={message.attachment.name} className="max-h-64 w-auto rounded-lg border border-white/10 object-contain" />
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{message.attachment.name}</span>
                  <span className="shrink-0 text-white/30">{(message.attachment.size / 1024).toFixed(0)} KB</span>
                </div>
              )}
            </div>
          ) : null}

          <p className="text-sm leading-6 text-foreground">{message.content}</p>
          {message.audio ? (
            <audio controls src={message.audio} className="mt-2 w-full rounded-lg" />
          ) : null}

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