import {
  BarChart3,
  Bot,
  Grid2X2,
  LayoutDashboard,
  Rocket,
  Settings,
  Wand2,
} from "lucide-react";

import type { NavItem } from "@/types/navigation";

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Ad Studio", href: "/creator-studio", icon: Grid2X2 },
  { title: "AI Growth Engine", href: "/growth-engine", icon: Rocket },
  { title: "AI Assistant", href: "/ai-assistant", icon: Bot },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const QUICK_CREATE_ITEMS = [
  {
    title: "Generate Ad",
    description: "Product swap studio",
    href: "/creator-studio",
    icon: Wand2,
  },
  {
    title: "Build Growth Engine",
    description: "Strategy to assets",
    href: "/growth-engine",
    icon: Rocket,
  },
];
