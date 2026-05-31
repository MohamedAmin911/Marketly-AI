import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-3 text-primary">
          <Sparkles className="size-6" />
        </div>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
        {action ? <Button className="mt-5">{action}</Button> : null}
      </CardContent>
    </Card>
  );
}
