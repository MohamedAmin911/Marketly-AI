"use client";import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sendAssistantMessage } from "@/features/ai-assistant/services";
import type { ChatAttachment, ChatMessage } from "@/features/ai-assistant/types/chat";

export type ChatSession = { _id: string; title: string };

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hello. I am ready to assist with your marketing strategy. How can I help you today?",
};

async function apiGetSessions(): Promise<ChatSession[]> {
  try { const r = await fetch("/api/ai-assistant/sessions", { credentials: "include" }); if (!r.ok) return []; const d = await r.json() as { data: { sessions: ChatSession[] } }; return d.data?.sessions ?? []; } catch { return []; }
}
async function apiCreateSession(): Promise<ChatSession | null> {
  try { const r = await fetch("/api/ai-assistant/sessions", { method: "POST", credentials: "include" }); if (!r.ok) return null; const d = await r.json() as { data: { session: ChatSession } }; return d.data?.session ?? null; } catch { return null; }
}
async function apiGetMessages(id: string): Promise<ChatMessage[]> {
  try { const r = await fetch(`/api/ai-assistant/sessions/${id}`, { credentials: "include" }); if (!r.ok) return []; const d = await r.json() as { data: { messages: ChatMessage[] } }; return d.data?.messages ?? []; } catch { return []; }
}
async function apiSaveMsg(id: string, msg: ChatMessage): Promise<void> {
  try { await fetch(`/api/ai-assistant/sessions/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: { id: msg.id, role: msg.role, content: msg.content } }) }); } catch { }
}
async function apiUpdateTitle(id: string, title: string): Promise<void> {
  try { await fetch(`/api/ai-assistant/sessions/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) }); } catch { }
}
async function apiDeleteSession(id: string): Promise<void> {
  try { await fetch(`/api/ai-assistant/sessions/${id}`, { method: "DELETE", credentials: "include" }); } catch { }
}

export function useAssistantChat() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const isFirstMsg = useRef(true);
  const initDone = useRef(false);

  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      await fetch("/api/ai-assistant/sessions/cleanup", { method: "POST", credentials: "include" }).catch(() => {});
      return apiGetSessions();
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const { isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat-messages", activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return [welcomeMessage];
      const cached = queryClient.getQueryData<ChatMessage[]>(["chat-messages", activeSessionId]);
      if (cached && cached.length > 0) {
        setMessages(cached);
        isFirstMsg.current = cached.filter(m => m.role === "user").length === 0;
        return cached;
      }
      const msgs = await apiGetMessages(activeSessionId);
      const result = msgs.length > 0 ? msgs : [welcomeMessage];
      setMessages(result);
      isFirstMsg.current = msgs.filter(m => m.role === "user").length === 0;
      return result;
    },
    enabled: !!activeSessionId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const isLoadingHistory = isLoadingSessions || isLoadingMessages;

  useEffect(() => {
    if (initDone.current || isLoadingSessions) return;
    initDone.current = true;
    async function init() {
      if (sessions.length === 0) {
        const s = await apiCreateSession();
        if (s) {
          queryClient.setQueryData(["chat-sessions"], [s]);
          setActiveSessionId(s._id);
        }
      } else {
        setActiveSessionId(sessions[0]._id);
      }
    }
    void init();
  }, [isLoadingSessions, sessions, queryClient]);

  async function loadSession(sessionId: string) {
    if (sessionId === activeSessionId) return;
    
    setMessages([welcomeMessage]);
    isFirstMsg.current = true;
    setActiveSessionId(sessionId);
    const cached = queryClient.getQueryData<ChatMessage[]>(["chat-messages", sessionId]);
    if (cached && cached.length > 0) {
      setMessages(cached);
      isFirstMsg.current = cached.filter(m => m.role === "user").length === 0;
    }
  }

  async function startNewChat() {
    const s = await apiCreateSession();
    if (!s) return;
    queryClient.setQueryData(["chat-sessions"], [s, ...sessions]);
    queryClient.setQueryData(["chat-messages", s._id], [welcomeMessage]);
    setMessages([welcomeMessage]);
    setActiveSessionId(s._id);
    setDraft("");
    setAttachment(null);
    isFirstMsg.current = true;
  }

  async function deleteSession(sessionId: string) {
    await apiDeleteSession(sessionId);
    const remaining = sessions.filter(s => s._id !== sessionId);
    queryClient.setQueryData(["chat-sessions"], remaining);
    queryClient.removeQueries({ queryKey: ["chat-messages", sessionId] });
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

    setMessages(prev => {
      const updated = [...prev, userMessage];
      if (activeSessionId) queryClient.setQueryData(["chat-messages", activeSessionId], updated);
      return updated;
    });
    if (activeSessionId) void apiSaveMsg(activeSessionId, userMessage);

    if (isFirstMsg.current && content && activeSessionId) {
      isFirstMsg.current = false;
      const title = content.slice(0, 50);
      queryClient.setQueryData(["chat-sessions"], sessions.map(s => s._id === activeSessionId ? { ...s, title } : s));
      void apiUpdateTitle(activeSessionId, title);
    }

    setDraft("");
    setAttachment(null);
    setIsSending(true);
    abortController.current?.abort();
    abortController.current = new AbortController();

    let apiMessage = content;
    let imageData: string | undefined;

    if (attachment) {
      if (attachment.mimeType.startsWith("image/")) {
        imageData = attachment.dataUrl;
        if (!apiMessage) apiMessage = "Please analyze this image in detail.";
      } else if (attachment.textContent) {
        apiMessage = `${content ? content + "\n\n" : ""}[Attached file: ${attachment.name}]\n\nFile contents:\n\`\`\`\n${attachment.textContent.slice(0, 8000)}\n\`\`\`\n\nPlease analyze the above file content and answer accordingly.`;
      }
    }

    try {
      const response = await sendAssistantMessage(apiMessage, abortController.current.signal, false, imageData);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        audio: undefined,
        card: response.recommendations[0] ? {
          metrics: [response.recommendations[0].action, response.recommendations[0].evidence, `Confidence ${Math.round(response.recommendations[0].confidence * 100)}%`],
          title: response.recommendations[0].title,
        } : undefined,
      };
      setMessages(prev => {
        const updated = [...prev, assistantMsg];
        if (activeSessionId) queryClient.setQueryData(["chat-messages", activeSessionId], updated);
        return updated;
      });
      if (activeSessionId) void apiSaveMsg(activeSessionId, assistantMsg);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I could not complete the assistant request. Check the strategy inputs or try again with more analytics context.",
      }]);
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, attachment, activeSessionId, sessions, queryClient]);

  useEffect(() => {
    return () => { abortController.current?.abort(); };
  }, []);

  return {
    activeSessionId, attachment, deleteSession, draft, isLoadingHistory,
    isSending, loadSession, messages, sendMessage, sessions,
    setAttachment, setDraft, setMessages, startNewChat, voiceEnabled, setVoiceEnabled,
  };
}