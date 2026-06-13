"use client";
 
import { Image, Loader2, MessageSquarePlus, Mic, Paperclip, PauseCircle, Send, Share2, Sparkles, Square, Trash2, Volume2, X } from "lucide-react";
import { useRef, useState } from "react";
 
import { PageShell } from "@/components/layout/page-shell";
import { StaggeredItem, StaggeredList } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/features/ai-assistant/components/chat-message";
import { useAssistantChat } from "@/features/ai-assistant/hooks";
import type { ChatAttachment } from "@/features/ai-assistant/types/chat";
 
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf", "text/plain", "text/csv"];
const MAX_SIZE_MB = 10;
 
const promptActions = [
  {
    label: "Draft proposal",
    icon: Sparkles,
    prompt: "Based on the current campaign analytics and brand context, draft a concise marketing proposal. Include key objectives, recommended channels, estimated budget allocation, and expected outcomes.",
  },
  {
    label: "Share meta metrics",
    icon: Share2,
    prompt: "Summarize the latest Meta (Facebook/Instagram) campaign metrics. Include impressions, CTR, conversions, ROI, and your top 3 recommendations to improve performance.",
  },
  {
    label: "Pause LinkedIn campaign",
    icon: PauseCircle,
    prompt: "Analyze the current LinkedIn campaign performance. Should I pause it? Give me a clear yes/no recommendation with supporting data and suggest what to do with the freed budget.",
  },
];
 
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
 
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
 
async function readPdfAsText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
  if (!res.ok) return `[Could not read PDF: ${file.name}]`;
  const data = await res.json() as { text?: string };
  return data.text ?? `[Empty PDF: ${file.name}]`;
}
 
export function AiAssistantView() {
  const {
    activeSessionId, attachment, deleteSession, draft, isLoadingHistory,
    isSending, loadSession, messages, sendMessage, sessions,
    setAttachment, setDraft, setMessages, startNewChat, voiceEnabled, setVoiceEnabled,
  } = useAssistantChat();
 
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
 
  function toggleVoice() {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
 
    if (!SR) { alert("Voice input requires Chrome or Edge."); return; }
    if (isListening) { recognitionRef.current?.stop(); return; }
 
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
 
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0]?.transcript + " ";
      }
      setDraft(text.trim());
    };
    recognition.onerror = (event) => {
      console.error("SpeechRecognition error:", event);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
 
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }
 
  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert("Unsupported file. Please upload PNG, JPG, WEBP, PDF, CSV, or TXT.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_SIZE_MB} MB.`);
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    let textContent: string | undefined;
    if (file.type === "text/plain" || file.type === "text/csv") {
      textContent = await readFileAsText(file);
    } else if (file.type === "application/pdf") {
      try { textContent = await readPdfAsText(file); }
      catch { textContent = `[PDF file: ${file.name} — could not extract text]`; }
    }
    setAttachment({ dataUrl, mimeType: file.type, name: file.name, size: file.size, textContent });
  }
 
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void sendMessage();
  }
 
  async function handleSpeak(text: string, messageId: string) {
    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const d = await r.json() as { audio?: string };
      if (d.audio) {
        // حط الـ audio في الـ message عشان يظهر كـ player
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audio: d.audio } : m));
      }
    } catch (e) {
      console.error("TTS error:", e);
    }
  }
 
  async function handleSend(override?: string) {
    await sendMessage(override);
  }
 
  const lastMessageId = messages.at(-1)?.id;
  const canSend = !isSending && (draft.trim().length > 0 || attachment !== null);
 
  return (
    <PageShell title="AI Assistant" description="Ask Marketly AI to analyze data, generate campaigns, or predict channel trends.">
      <div className="mx-auto flex max-w-6xl gap-4">
 
        {/* ── Sessions Sidebar ── */}
        <aside className="hidden w-52 shrink-0 lg:flex lg:flex-col lg:gap-2">
          <Button variant="secondary" size="sm" className="w-full justify-start gap-2" onClick={() => void startNewChat()}>
            <MessageSquarePlus className="size-4" />
            New Chat
          </Button>
          <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[70vh]">
            {isLoadingHistory ? (
              <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted">
                <Loader2 className="size-3 animate-spin" /> Loading…
              </div>
            ) : sessions.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted">No previous chats.</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session._id}
                  onClick={() => void loadSession(session._id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white/5 ${activeSessionId === session._id ? "bg-white/10 text-foreground" : "text-muted"}`}
                >
                  <span className="truncate">{session.title || "New Chat"}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void deleteSession(session._id); }}
                    className="ml-1 hidden shrink-0 rounded p-0.5 hover:text-red-400 group-hover:block"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
 
        {/* ── Main Chat ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading conversation…
            </div>
          ) : (
            <StaggeredList className="space-y-5" aria-live="polite">
              {messages.map((message) => (
                <StaggeredItem key={message.id}>
                  <ChatMessage
                    message={message}
                    onSpeak={voiceEnabled && message.role === "assistant" ? (text) => void handleSpeak(text, message.id) : undefined}
                  />
                </StaggeredItem>
              ))}
            </StaggeredList>
          )}
 
          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2" aria-label="Suggested prompts">
            {promptActions.map(({ label, icon: Icon, prompt }) => (
              <Button key={label} variant="secondary" size="sm" type="button" onClick={() => void handleSend(prompt)}>
                <Icon className="size-3" />
                {label}
              </Button>
            ))}
          </div>
 
          <Card className="p-3">
            <label className="sr-only" htmlFor="assistant-draft">Message Marketly AI</label>
            <Textarea
              id="assistant-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-24 border-0 bg-transparent"
              placeholder="Ask Marketly AI… or attach a file for analysis (Ctrl+Enter to send)"
            />
 
            {attachment ? (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2">
                {attachment.mimeType.startsWith("image/") ? (
                  <img src={attachment.dataUrl} alt={attachment.name} className="size-12 rounded-md border border-white/10 object-cover" />
                ) : (
                  <div className="grid size-12 place-items-center rounded-md border border-white/10 bg-white/5">
                    <Paperclip className="size-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{attachment.name}</p>
                  <p className="text-xs text-muted">{(attachment.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={() => setAttachment(null)} className="shrink-0 rounded-full p-1 text-muted hover:text-foreground" aria-label="Remove">
                  <X className="size-4" />
                </button>
              </div>
            ) : null}
 
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex items-center gap-1">
 
                {/* Voice input */}
                <Button variant="ghost" size="icon" type="button" aria-label={isListening ? "Stop recording" : "Voice input"} onClick={toggleVoice} className={isListening ? "text-red-400 animate-pulse" : ""}>
                  {isListening ? <Square className="size-4 fill-red-400" /> : <Mic className="size-4" />}
                </Button>
 
                {/* Voice output toggle */}
                <Button
                  variant="ghost" size="icon" type="button"
                  aria-label={voiceEnabled ? "Disable voice response" : "Enable voice response"}
                  onClick={() => setVoiceEnabled((v) => !v)}
                  className={voiceEnabled ? "text-primary" : ""}
                  title={voiceEnabled ? "Voice response ON" : "Voice response OFF"}
                >
                  <Volume2 className="size-4" />
                </Button>
 
                {/* Image upload */}
                <Button variant="ghost" size="icon" type="button" aria-label="Attach image" onClick={() => imageInputRef.current?.click()}>
                  <Image className="size-4" />
                </Button>
                <input ref={imageInputRef} type="file" className="hidden" accept={ALLOWED_IMAGE_TYPES.join(",")} onChange={(e) => void handleFileSelected(e.target.files?.[0]).then(() => { e.target.value = ""; })} />
 
                {/* File upload */}
                <Button variant="ghost" size="icon" type="button" aria-label="Attach file" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="size-4" />
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" accept={ALLOWED_FILE_TYPES.join(",")} onChange={(e) => void handleFileSelected(e.target.files?.[0]).then(() => { e.target.value = ""; })} />
              </div>
 
              <Button onClick={() => void handleSend()} type="button" disabled={!canSend}>
                {isSending ? "Thinking" : "Send"}
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}