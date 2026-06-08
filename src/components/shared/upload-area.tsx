"use client";

import { UploadCloud } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

export function UploadArea({
  label = "Drag & drop product image",
  onFileSelect,
}: {
  label?: string;
  onFileSelect?: (file: File) => void;
}) {
  const [isDragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const selectFile = useCallback((file?: File | null) => {
    if (!file) return;
    setFileName(file.name);
    onFileSelect?.(file);
  }, [onFileSelect]);

  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    selectFile(file);
  }, [selectFile]);

  return (
    <label
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/20 bg-primary/[0.03] p-5 text-center transition-all hover:border-primary/60 hover:bg-primary/5",
        isDragging && "border-cyan-glow bg-cyan-glow/10 shadow-[0_0_24px_rgba(114,255,95,0.18)]",
      )}
    >
      <input
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <UploadCloud className="mb-3 size-7 text-primary" />
      <span className="text-sm font-medium text-foreground">{fileName ?? label}</span>
      <span className="mt-1 text-xs text-muted">PNG, JPG or WEBP up to 10MB</span>
    </label>
  );
}
