"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type * as React from "react";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  const { t } = useTranslation();

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 pointer-events-none">
        <DialogPrimitive.Content
          className={cn(
            "glass-panel relative grid w-full max-w-lg gap-4 rounded-lg p-6 shadow-glow focus-visible:outline-none pointer-events-auto",
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute end-4 top-4 rounded-lg p-2 text-muted transition-colors hover:bg-card hover:text-foreground">
            <X className="size-4" />
            <span className="sr-only">{t("common.close")}</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-display text-2xl font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm leading-6 text-muted", className)} {...props} />;
}
