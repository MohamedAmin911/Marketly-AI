import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
};

export function EmptyState({ title, description, action, icon: Icon = Sparkles }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-56 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-3 text-primary">
          <Icon className="size-6" />
        </div>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
        {typeof action === "string" ? <Button className="mt-5">{action}</Button> : action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
