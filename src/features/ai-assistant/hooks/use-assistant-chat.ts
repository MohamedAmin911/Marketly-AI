"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { sendAssistantMessage } from "@/features/ai-assistant/services";
import type { ChatAttachment, ChatMessage } from "@/features/ai-assistant/types/chat";

export type ChatSession = { _id: string; title: string };

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hello. I am ready to assist with your marketing strategy. How can I help you today?",
};

async function apiGetSessions(): Promise<ChatSession[]> {
  try { const r = await fetch("/api/ai-assistant/sessions"); if (!r.ok) return []; const d = await r.json() as { sessions: ChatSession[] }; return d.sessions ?? []; } catch { return []; }
}
async function apiCreateSession(): Promise<ChatSession | null> {
  try { const r = await fetch("/api/ai-assistant/sessions", { method: "POST" }); if (!r.ok) return null; const d = await r.json() as { session: ChatSession }; return d.session; } catch { return null; }
}
async function apiGetMessages(id: string): Promise<ChatMessage[]> {
  try { const r = await fetch(`/api/ai-assistant/sessions/${id}`); if (!r.ok) return []; const d = await r.json() as { messages: ChatMessage[] }; return d.messages ?? []; } catch { return []; }
}
async function apiSaveMsg(id: string, msg: ChatMessage): Promise<void> {
  try { await fetch(`/api/ai-assistant/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: { id: msg.id, role: msg.role, content: msg.content } }) }); } catch { /* ignore */ }
}
async function apiUpdateTitle(id: string, title: string): Promise<void> {
  try { await fetch(`/api/ai-assistant/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) }); } catch { /* ignore */ }
}
async function apiDeleteSession(id: string): Promise<void> {
  try { await fetch(`/api/ai-assistant/sessions/${id}`, { method: "DELETE" }); } catch { /* ignore */ }
}



export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const isFirstMsg = useRef(true);

  // Load sessions on mount
  useEffect(() => {
    async function init() {
      const list = await apiGetSessions();
      if (!mounted.current) return;
      if (list.length === 0) {
        const s = await apiCreateSession();
        if (s && mounted.current) { setSessions([s]); setActiveSessionId(s._id); }
      } else {
        setSessions(list);
        const latest = list[0];
        setActiveSessionId(latest._id);
        const msgs = await apiGetMessages(latest._id);
        if (mounted.current) {
          setMessages(msgs.length > 0 ? msgs : [welcomeMessage]);
          isFirstMsg.current = msgs.filter(m => m.role === "user").length === 0;
        }
      }
      if (mounted.current) setIsLoadingHistory(false);
    }
    void init();
  }, []);

  async function loadSession(sessionId: string) {
    setIsLoadingHistory(true);
    const msgs = await apiGetMessages(sessionId);
    if (!mounted.current) return;
    setActiveSessionId(sessionId);
    setMessages(msgs.length > 0 ? msgs : [welcomeMessage]);
    isFirstMsg.current = msgs.filter(m => m.role === "user").length === 0;
    setIsLoadingHistory(false);
  }

  async function startNewChat() {
    const s = await apiCreateSession();
    if (!s || !mounted.current) return;
    setSessions(prev => [s, ...prev]);
    setActiveSessionId(s._id);
    setMessages([welcomeMessage]);
    setDraft(""); setAttachment(null);
    isFirstMsg.current = true;
  }

  async function deleteSession(sessionId: string) {
    await apiDeleteSession(sessionId);
    const remaining = sessions.filter(s => s._id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      if (remaining.length > 0) await loadSession(remaining[0]._id);
      else await startNewChat();
    }
  }

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
    if (activeSessionId) void apiSaveMsg(activeSessionId, userMessage);

    // Set title from first user message
    if (isFirstMsg.current && content && activeSessionId) {
      isFirstMsg.current = false;
      const title = content.slice(0, 50);
      setSessions(prev => prev.map(s => s._id === activeSessionId ? { ...s, title } : s));
      void apiUpdateTitle(activeSessionId, title);
    }

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
      const response = await sendAssistantMessage(apiMessage, abortController.current.signal, false, imageData);

      if (!mounted.current) return;

      const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          audio: undefined,
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
    activeSessionId,
    attachment,
    deleteSession,
    draft,
    isLoadingHistory,
    isSending,
    loadSession,
    messages,
    sendMessage,
    sessions,
    setAttachment,
    setDraft,
    startNewChat,
    voiceEnabled,
    setVoiceEnabled,
  };
}