import type { ReactNode } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Card } from "@/components/ui/card";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 grid-field opacity-60" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(2,9,2,.42),rgba(2,9,2,.92))]" />
      <Card className="relative w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 mt-2 flex justify-center">
          <BrandMark className="flex-col" />
        </div>
        {children}
      </Card>
    </main>
  );
}
