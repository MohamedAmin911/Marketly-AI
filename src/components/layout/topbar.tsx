"use client";

import { Menu, UserRound, Coins } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/store/ui-store";
import { useBilling } from "@/features/billing/hooks/use-billing";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function Topbar() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const { billing } = useBilling();
  const { isRtl, t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  };

  const totalCredits = billing?.subscription 
    ? billing.subscription.monthlyCreditsRemaining + (billing.subscription.purchasedCredits || 0)
    : 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/82 px-4 backdrop-blur-2xl lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
          aria-label={t("topbar.openNavigation")}
        >
          <Menu className="size-5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {billing?.subscription && (
          <Link href="/settings?tab=billing" className="me-1 flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
            <Coins className="size-3.5" />
            {totalCredits.toLocaleString()} {t("topbar.credits")}
          </Link>
        )}
        <LanguageToggle />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ms-1 grid size-10 place-items-center rounded-lg border border-border bg-card text-foreground shadow-[var(--panel-shadow)] transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <UserRound className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRtl ? "start" : "end"}>
            <DropdownMenuItem asChild>
              <Link href="/settings">{t("topbar.workspaceSettings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=billing">{t("topbar.billing")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              {t("topbar.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
