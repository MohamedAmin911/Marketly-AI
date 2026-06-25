import Link from "next/link";

import { ActionCard } from "@/components/shared/action-card";
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
          <Link key={item.title} href={item.href} className="block focus-visible:outline-none">
            <ActionCard title={item.title} description={item.description} icon={item.icon} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

