"use client";

/* eslint-disable @next/next/no-img-element */

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImageUploadCardProps = {
  eyebrow: string;
  hint: string;
  image: File | null;
  onImageChange: (file: File | null) => void;
};

export function ImageUploadCard({ eyebrow, hint, image, onImageChange }: ImageUploadCardProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  function selectFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    onImageChange(file);
  }

  return (
    <div className="group space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-white">{eyebrow}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>
        </div>
        {image ? (
          <Button variant="icon" size="icon" type="button" aria-label={`Remove ${eyebrow}`} onClick={() => onImageChange(null)}>
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          selectFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative grid min-h-52 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-primary/20 bg-primary/[0.04] p-4 transition-all duration-300 hover:border-primary/60 hover:bg-primary/[0.07] hover:shadow-[0_0_34px_rgba(114,255,95,0.12)]",
          isDragging && "border-cyan-glow/80 bg-cyan-glow/10 shadow-[0_0_40px_rgba(114,255,95,0.18)]",
        )}
      >
        <input id={inputId} type="file" accept="image/*" className="sr-only" onChange={(event) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />

        {previewUrl ? (
          <>
            <img src={previewUrl} alt={`${eyebrow} preview`} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
              <p className="truncate text-sm font-semibold text-white">{image?.name}</p>
              <p className="text-xs text-muted">{image ? `${Math.max(image.size / 1024 / 1024, 0.01).toFixed(2)} MB` : null}</p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-lg border border-primary/15 bg-primary/[0.06] text-primary shadow-[0_0_30px_rgba(114,255,95,0.18)]">
              <ImagePlus className="size-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Drop image here or click to upload</p>
            <p className="mt-1 text-xs text-muted">PNG, JPG, or WebP</p>
          </div>
        )}
      </label>
    </div>
  );
}
