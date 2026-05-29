"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { sendAssistantMessage } from "@/features/ai-assistant/services";
import type { ChatMessage } from "@/features/ai-assistant/types/chat";

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello. I am ready to assist with your marketing strategy. I have analyzed your latest campaign metrics. It appears your conversion rate for the Q3 Launch has dropped by 4.2% in the last 48 hours.",
  },
  {
    id: "2",
    role: "user",
    content: "Generate a brief root cause analysis for the drop, focusing on ad spend allocation across channels.",
  },
  {
    id: "3",
    role: "assistant",
    content: "Root cause analysis suggests audience saturation and a Meta delivery change are the highest confidence factors.",
    card: {
      title: "Root Cause Analysis: Q3 Launch Drop",
      metrics: ["LinkedIn allocation saturated target audience", "Unplanned algorithm update on Meta reduced reach", "Budget shifted too late to search demand"],
    },
  },
];

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  const sendMessage = useCallback(async (override?: string) => {
    if (isSending) return;
    const content = (override ?? draft).trim();

    if (!content) return;

    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", content }]);
    setDraft("");
    setIsSending(true);
    abortController.current?.abort();
    abortController.current = new AbortController();

    try {
      const response = await sendAssistantMessage(content, abortController.current.signal);

      if (!mounted.current) return;

      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          card: response.recommendations[0]
            ? {
                metrics: [response.recommendations[0].action, response.recommendations[0].evidence, `Confidence ${Math.round(response.recommendations[0].confidence * 100)}%`],
                title: response.recommendations[0].title,
              }
            : undefined,
        },
      ]);
    } catch (error) {
      if (!mounted.current || (error instanceof DOMException && error.name === "AbortError")) return;

      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I could not complete the assistant request. Check the strategy inputs or try again with more analytics context.",
        },
      ]);
    } finally {
      if (mounted.current) setIsSending(false);
    }
  }, [draft, isSending]);

  useEffect(() => {
    return () => {
      mounted.current = false;
      abortController.current?.abort();
    };
  }, []);

  return {
    draft,
    isSending,
    messages,
    sendMessage,
    setDraft,
  };
}
