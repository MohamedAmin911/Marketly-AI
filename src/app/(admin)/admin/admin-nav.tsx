"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, Tag, Globe, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import type { TranslationKey } from "@/lib/i18n/translations";

type NavItem = {
  labelKey: TranslationKey;
  href: string;
  icon: LucideIcon;
};

const nav: NavItem[] = [
  { labelKey: "admin.navDashboard", href: "/admin", icon: LayoutDashboard },
  { labelKey: "admin.navUsers", href: "/admin/users", icon: Users },
  { labelKey: "admin.navPromo", href: "/admin/promo", icon: Tag },
];

import { useTranslation } from "@/lib/i18n/useTranslation";

export function AdminNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {nav.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted hover:bg-muted/10 hover:text-foreground"
            )}
          >
            <item.icon className={cn("size-4", isActive ? "text-primary" : "text-muted")} />
            {t(item.labelKey)}
          </Link>
        );
      })}
      
      <div className="pt-4 mt-4 border-t border-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted hover:bg-muted/10 hover:text-foreground"
        >
          <Globe className="size-4 text-muted" />
          {t("admin.navExit")}
        </Link>
      </div>
    </nav>
  );
}
