import Link from "next/link";

import { ActionCard } from "@/components/shared/action-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUICK_CREATE_ITEMS } from "@/lib/constants/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function QuickActionsCard({ features }: { features?: Record<string, boolean> }) {
  const { t } = useTranslation();
  const items = QUICK_CREATE_ITEMS.filter(
    (item) => !item.feature || (features && features[item.feature])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("quick.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link key={item.title} href={item.href} className="block focus-visible:outline-none">
            <ActionCard
              title={t(item.translationKey)}
              description={t(item.descriptionKey)}
              icon={item.icon}
            />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

