import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-red-300/20">
      <CardContent className="flex items-center gap-3 text-red-100">
        <AlertTriangle className="size-5" />
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
