"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, Tag, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const nav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users & Subscriptions", href: "/admin/users", icon: Users },
  { label: "Promo Codes", href: "/admin/promo", icon: Tag },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {nav.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted hover:bg-muted/10 hover:text-foreground"
            )}
          >
            <item.icon className={cn("size-4", isActive ? "text-primary" : "text-muted")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
