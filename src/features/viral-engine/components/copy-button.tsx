"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CopyButtonProps {
  data: any;
  label?: string;
  variant?: "default" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CopyButton({ data, label, variant = "ghost", size = "icon", className }: CopyButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const textToCopy = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleCopy} 
      className={cn("transition-all", className)}
      title="Copy to clipboard"
    >
      {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
      {label && <span className="ms-2">{copied ? t("viralEngine.general.copied") : label}</span>}
    </Button>
  );
}
