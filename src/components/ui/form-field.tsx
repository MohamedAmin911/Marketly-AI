import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  description?: string;
  error?: string;
  id?: string;
};

export function FormField({ label, children, className, description, error, id }: FormFieldProps) {
  const descriptionId = id && description ? `${id}-description` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {description ? (
        <p id={descriptionId} className="text-xs leading-5 text-muted">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs leading-5 text-red-200" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

