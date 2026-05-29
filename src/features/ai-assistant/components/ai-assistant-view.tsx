"use client";

import { Loader2, Mic, PauseCircle, Send, Share2, Sparkles } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { StaggeredItem, StaggeredList } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/features/ai-assistant/components/chat-message";
import { useAssistantChat } from "@/features/ai-assistant/hooks";

const promptActions = [
  { label: "Draft proposal", icon: Sparkles },
  { label: "Share meta metrics", icon: Share2 },
  { label: "Pause LinkedIn campaign", icon: PauseCircle },
];

export function AiAssistantView() {
  const { draft, isSending, messages, sendMessage, setDraft } = useAssistantChat();

  return (
    <PageShell title="AI Assistant" description="Ask Marketly AI to analyze data, generate campaigns, or predict channel trends.">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <StaggeredList className="space-y-5" aria-live="polite">
          {messages.map((message) => (
            <StaggeredItem key={message.id}>
              <ChatMessage message={message} />
            </StaggeredItem>
          ))}
        </StaggeredList>

        <div className="flex flex-wrap gap-2" aria-label="Suggested prompts">
          {promptActions.map(({ label, icon: Icon }) => (
            <Button key={label} variant="secondary" size="sm" type="button" onClick={() => void sendMessage(label)}>
              <Icon className="size-3" />
              {label}
            </Button>
          ))}
        </div>

        <Card className="p-3">
          <label className="sr-only" htmlFor="assistant-draft">
            Message Marketly AI
          </label>
          <Textarea
            id="assistant-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-24 border-0 bg-transparent"
            placeholder="Ask Marketly AI to analyze data, generate campaigns, or predict trends..."
          />
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <Button variant="ghost" size="icon" aria-label="Voice input" type="button">
              <Mic className="size-4" />
            </Button>
            <Button onClick={() => void sendMessage()} type="button" disabled={isSending}>
              {isSending ? "Thinking" : "Send"}
              {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
