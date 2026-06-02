"use client";

import { Bell, HelpCircle, Menu, Search, UserRound } from "lucide-react";
import { Menu, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/store/ui-store";

export function Topbar() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-primary/15 bg-background/78 px-4 backdrop-blur-2xl lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" className="lg:hidden" onClick={toggleSidebar} aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
        <div className="relative hidden w-[min(36vw,28rem)] md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="h-10 rounded-full pl-10" placeholder="Search campaigns, assets..." />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="icon" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <Button variant="icon" size="icon" aria-label="Help">
          <HelpCircle className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 grid size-10 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-white shadow-[0_0_18px_rgba(114,255,95,0.12)]">
              <UserRound className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Workspace settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
