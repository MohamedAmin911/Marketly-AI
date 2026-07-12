"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

import { useBilling } from "@/features/billing/hooks/use-billing";

function SidebarContent({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const { billing } = useBilling();
  const { isRtl, t } = useTranslation();

  const allowedNavItems = NAV_ITEMS.filter((item) => {
    if (item.role && item.role !== userRole) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4 mb-3">
        <BrandMark />
        <button className="rounded-lg p-2 text-muted transition-colors hover:bg-card hover:text-foreground lg:hidden" onClick={() => setSidebarOpen(false)} aria-label={t("topbar.closeNavigation")}>
          <X className="size-5" />
        </button>
      </div>
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {allowedNavItems.map((item) => {
          const active = pathname === item.href;
          const isLocked = userRole !== "admin" && item.feature && billing?.features ? !billing.features[item.feature] : false;

          return (
            <Link
              key={item.href}
              href={isLocked ? "/settings?tab=billing#plans" : item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group relative flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 text-sm font-medium transition-all",
                active 
                  ? cn("border-primary/30 bg-primary/10 text-foreground", isRtl ? "shadow-[inset_-2px_0_0_var(--primary),0_0_0_1px_var(--focus-ring)]" : "shadow-[inset_2px_0_0_var(--primary),0_0_0_1px_var(--focus-ring)]")
                  : "text-muted hover:border-border hover:bg-card hover:text-foreground",
                isLocked && "opacity-60 cursor-pointer hover:opacity-100 hover:bg-transparent hover:border-transparent"
              )}
            >
              {active && !isLocked ? <span className={cn("absolute top-2 h-7 w-1 rounded-full neon-gradient", isRtl ? "right-0" : "left-0")} /> : null}
              <item.icon className={cn("size-4", active && !isLocked && "text-primary")} />
              <span className="flex-1 truncate">{item.translationKey ? t(item.translationKey) : item.title}</span>
              {isLocked && <span className="text-[10px] uppercase font-bold text-muted bg-surface-container-high px-1.5 py-0.5 rounded">Pro</span>}
            </Link>
          );
        })}
      </nav>

      {(!billing || billing.subscription?.plan === "free" || billing.subscription?.plan === "starter") && (
        <div className="p-4 mt-auto mb-2">
          <Link
            href="/settings?tab=billing#plans"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold text-primary-foreground neon-gradient shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Sparkles className="size-4" />
            <span>{t("nav.upgradeToPro")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ userRole }: { userRole?: string }) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const { isRtl } = useTranslation();

  return (
    <>
      <aside className={cn("fixed inset-y-0 z-40 hidden w-72 bg-surface/92 backdrop-blur-2xl lg:block", isRtl ? "right-0 border-l border-border" : "left-0 border-r border-border")}>
        <SidebarContent userRole={userRole} />
      </aside>
      <AnimatePresence>
        {sidebarOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className={cn("fixed inset-y-0 z-50 w-[min(20rem,88vw)] bg-surface/96 backdrop-blur-2xl lg:hidden", isRtl ? "right-0 border-l border-border" : "left-0 border-r border-border")}
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
            >
              <SidebarContent userRole={userRole} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
