import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--button-shadow)] hover:bg-secondary hover:shadow-[var(--button-shadow-hover)]",
        secondary: "border border-border bg-card text-foreground hover:border-primary/45 hover:bg-surface-container-high",
        outline: "border border-border bg-transparent text-foreground hover:border-primary/45 hover:bg-surface-container-high",
        ghost: "text-muted hover:bg-card hover:text-foreground",
        danger: "border border-red-300/20 bg-red-400/10 text-red-100 hover:bg-red-400/20",
        icon: "size-10 rounded-lg border border-border bg-card p-0 text-muted hover:border-primary/45 hover:bg-surface-container-high hover:text-primary",
      },
      size: {
        default: "h-11",
        sm: "h-9 min-h-9 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
