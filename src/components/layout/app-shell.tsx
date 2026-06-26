import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-65">
        <div className="absolute inset-0 grid-field" />
        <div className="absolute inset-0 bg-[image:var(--app-overlay)]" />
      </div>
      <Sidebar />
      <div className="relative z-10 lg:pl-72">
        <Topbar />
        <main>{children}</main>
      </div>
    </div>
  );
}
