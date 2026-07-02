import Link from "next/link";

import { ActionCard } from "@/components/shared/action-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUICK_CREATE_ITEMS } from "@/lib/constants/navigation";

import type { BillingInfo } from "@/features/billing/hooks/use-billing";

export function QuickActionsCard({ features }: { features?: Record<string, boolean> }) {
  const items = QUICK_CREATE_ITEMS.filter(
    (item) => !item.feature || (features && features[item.feature])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link key={item.title} href={item.href} className="block focus-visible:outline-none">
            <ActionCard title={item.title} description={item.description} icon={item.icon} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

