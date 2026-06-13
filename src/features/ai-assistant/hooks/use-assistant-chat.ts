
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sendAssistantMessage } from "@/features/ai-assistant/services";
import type { ChatAttachment, ChatMessage } from "@/features/ai-assistant/types/chat";
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

async function speakWithElevenLabs(text: string): Promise<void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const data = await res.json() as { audio?: string };
    if (data.audio) {
      const audio = new Audio(data.audio);
      audio.play().catch(() => {});
    }
  } catch {
    // TTS failed silently
  }
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  const sendMessage = useCallback(async (override?: string): Promise<void> => {
    if (isSending) return;
    const content = (override ?? draft).trim();

    if (!content && !attachment) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content || `[Attached: ${attachment?.name}]`,
      attachment: attachment ?? undefined,
    };

    setMessages((items) => [...items, userMessage]);
    setDraft("");
    setAttachment(null);
    setIsSending(true);
    abortController.current?.abort();
    abortController.current = new AbortController();

    // Build message for API
    let apiMessage = content;
    let imageData: string | undefined;

    if (attachment) {
      if (attachment.mimeType.startsWith("image/")) {
        // Send image as base64 for vision analysis
        imageData = attachment.dataUrl;
        if (!apiMessage) apiMessage = "Please analyze this image in detail.";
      } else if (attachment.textContent) {
        // Text/CSV — inject content into message
        apiMessage = `${content ? content + "\n\n" : ""}[Attached file: ${attachment.name}]\n\nFile contents:\n\`\`\`\n${attachment.textContent.slice(0, 8000)}\n\`\`\`\n\nPlease analyze the above file content and answer accordingly.`;
      }
    }

    try {
      const response = await sendAssistantMessage(apiMessage, abortController.current.signal, voiceEnabled, imageData);

      if (!mounted.current) return;

      const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          audio: response.audio ?? undefined,
          card: response.recommendations[0]
            ? {
                metrics: [response.recommendations[0].action, response.recommendations[0].evidence, `Confidence ${Math.round(response.recommendations[0].confidence * 100)}%`],
                title: response.recommendations[0].title,
              }
            : undefined,
        };

      setMessages((items) => [...items, assistantMsg]);
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
  }, [draft, isSending, attachment]);

  useEffect(() => {
    return () => {
      mounted.current = false;
      abortController.current?.abort();
    };
  }, []);

  return {
    attachment,
    draft,
    isSending,
    messages,
    sendMessage,
    setAttachment,
    setDraft,
    voiceEnabled,
    setVoiceEnabled,
  };
}