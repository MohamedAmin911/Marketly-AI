import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatOrdinal(value: number): string {
  return new Intl.NumberFormat("en", { minimumIntegerDigits: 2 }).format(value);
}

export function createRange(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

export function wait(ms = 650): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
