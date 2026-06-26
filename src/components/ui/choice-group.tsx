import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ChoiceOption<TValue extends string = string> = {
  label: ReactNode;
  value: TValue;
  ariaLabel?: string;
};

type ChoiceGroupProps<TValue extends string = string> = {
  label: string;
  name: string;
  options: ChoiceOption<TValue>[];
  className?: string;
  defaultValue?: TValue;
  value?: TValue;
  onChange?: (value: TValue) => void;
};

export function ChoiceGroup<TValue extends string = string>({
  label,
  name,
  options,
  className,
  defaultValue,
  value,
  onChange,
}: ChoiceGroupProps<TValue>) {
  return (
    <fieldset className={cn("grid gap-2", className)}>
      <legend className="sr-only">{label}</legend>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(4rem,1fr))] gap-2">
        {options.map((option) => {
          const checked = value ? value === option.value : defaultValue === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "grid min-h-10 cursor-pointer place-items-center rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted transition-colors focus-within:ring-2 focus-within:ring-primary/70 hover:border-primary/50 hover:bg-card hover:text-primary",
                checked && "border-primary/60 bg-primary/10 text-primary shadow-[0_0_0_3px_var(--focus-ring)]",
              )}
            >
              <input
                aria-label={option.ariaLabel}
                checked={value ? checked : undefined}
                className="sr-only"
                defaultChecked={!value && defaultValue === option.value}
                name={name}
                onChange={() => onChange?.(option.value)}
                type="radio"
                value={option.value}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

