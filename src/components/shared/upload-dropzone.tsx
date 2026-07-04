"use client";

import { UploadCloud } from "lucide-react";
import type { DragEvent } from "react";
import { useCallback, useId, useState } from "react";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  label?: string;
  description?: string;
  accept?: string;
  onFileSelect?: (file: File) => void;
  className?: string;
};

export function UploadDropzone({
  label,
  description,
  accept = "image/png,image/jpeg,image/webp",
  onFileSelect,
  className,
}: UploadDropzoneProps) {
  const { t } = useTranslation();
  const [isDragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputId = useId();

  const selectFile = useCallback(
    (file?: File | null) => {
      if (!file) return;
      setFileName(file.name);
      onFileSelect?.(file);
    },
    [onFileSelect],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragging(false);
      selectFile(event.dataTransfer.files?.[0]);
    },
    [selectFile],
  );

  return (
    <label
      htmlFor={inputId}
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface p-5 text-center transition-all hover:border-primary/60 hover:bg-card",
        isDragging && "border-primary bg-primary/10 shadow-[0_0_0_3px_var(--focus-ring)]",
        className,
      )}
    >
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept={accept}
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <span className="mb-3 grid size-11 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        <UploadCloud className="size-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-foreground">{fileName ?? label ?? t("studio.dragDropProductImage")}</span>
      <span className="mt-1 text-xs text-muted">{description ?? t("studio.fileTypes")}</span>
    </label>
  );
}
