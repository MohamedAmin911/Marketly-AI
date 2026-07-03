"use client";

import { useUiStore } from "@/store/ui-store";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export function GlobalToaster() {
  const { toasts, removeToast } = useUiStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-surface p-4 shadow-xl 
            animate-in slide-in-from-bottom-5 fade-in-20 duration-300
            ${toast.type === "success" ? "border-green-500/50" : toast.type === "error" ? "border-red-500/50" : "border-border"}
          `}
        >
          {toast.type === "success" && <CheckCircle className="size-5 text-green-500 shrink-0" />}
          {toast.type === "error" && <XCircle className="size-5 text-red-500 shrink-0" />}
          {toast.type === "info" && <Info className="size-5 text-blue-500 shrink-0" />}
          
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-foreground leading-none tracking-tight">{toast.title}</h3>
            {toast.description && (
              <p className="text-sm text-muted leading-relaxed">{toast.description}</p>
            )}
          </div>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="text-muted hover:text-foreground transition-colors shrink-0 p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
