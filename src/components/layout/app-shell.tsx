"use client";

import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

export function AppShell({ children, userRole = "user" }: { children: ReactNode; userRole?: string }) {
  const { isRtl } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-65">
        <div className="absolute inset-0 grid-field" />
        <div className="absolute inset-0 bg-[image:var(--app-overlay)]" />
      </div>
      <Sidebar userRole={userRole} />
      <div className={cn("relative z-10", isRtl ? "lg:pr-72" : "lg:pl-72")}>
        <Topbar />
        <main>{children}</main>
      </div>
    </div>
  );
}
