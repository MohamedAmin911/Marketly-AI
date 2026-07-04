import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/translations";

export type NavItem = {
  title: string;
  translationKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  href: string;
  icon: LucideIcon;
  badge?: string;
  role?: string;
};
