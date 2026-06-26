"use client";

import { Textarea } from "@/components/ui/textarea";

type PromptBoxProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PromptBox({ value, onChange }: PromptBoxProps) {
  return (
    <div>
      <label htmlFor="additional-instructions" className="sr-only">
        Additional Instructions
      </label>
      <Textarea
        id="additional-instructions"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: preserve the exact headline, make the bottle label face camera, keep reflections natural..."
        className="min-h-32"
      />
    </div>
  );
}
