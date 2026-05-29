"use client";

import { Textarea } from "@/components/ui/textarea";

type PromptBoxProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PromptBox({ value, onChange }: PromptBoxProps) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="additional-instructions" className="font-display text-lg font-semibold text-white">
          Additional Instructions
        </label>
        <p className="mt-1 text-xs leading-5 text-muted">Optional direction for brand tone, campaign context, or product placement nuance.</p>
      </div>
      <Textarea
        id="additional-instructions"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: preserve the exact headline, make the bottle label face camera, keep reflections natural..."
        className="min-h-36 bg-black/20"
      />
    </div>
  );
}
