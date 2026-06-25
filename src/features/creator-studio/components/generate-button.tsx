"use client";

import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type GenerateButtonProps = {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
};

export function GenerateButton({ disabled, loading, onClick }: GenerateButtonProps) {
  return (
    <Button type="button" size="lg" className="h-14 w-full text-base" disabled={disabled || loading} onClick={onClick}>
      {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
      {loading ? "Composing Advertisement" : "Generate Advertisement"}
    </Button>
  );
}
