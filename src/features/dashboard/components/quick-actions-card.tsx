import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUICK_CREATE_ITEMS } from "@/lib/constants/navigation";

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {QUICK_CREATE_ITEMS.map((item) => (
          <Link key={item.title} href={item.href} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-all hover:border-primary/35 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow">
            <span className="grid size-10 place-items-center rounded-lg bg-white/[0.06] text-primary" aria-hidden="true">
              <item.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">{item.title}</span>
              <span className="block truncate text-xs text-muted">{item.description}</span>
            </span>
            <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

