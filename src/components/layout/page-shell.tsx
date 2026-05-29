import type { ReactNode } from "react";

import { PageTransition } from "@/components/shared/page-transition";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PageTransition>
      <section className={cn("mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8", className)}>
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-primary/10 pb-6 md:flex-row md:items-end">
          <div>
            <h1 className="terminal-title text-3xl font-bold text-white md:text-5xl">{title}</h1>
            {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted md:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
        {children}
      </section>
    </PageTransition>
  );
}
