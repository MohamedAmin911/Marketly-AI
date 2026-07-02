import {
  BarChart3,
  Bot,
  Film,
  Grid2X2,
  Image as ImageIcon,
  LayoutDashboard,
  Rocket,
  Settings,
  Wand2,
} from "lucide-react";

import type { NavItem } from "@/types/navigation";

export const NAV_ITEMS: (NavItem & { feature?: string })[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Ad Studio", href: "/creator-studio", icon: Grid2X2 },
  { title: "AI Growth Engine", href: "/growth-engine", icon: Rocket, feature: "growthEngine" },
  { title: "Image Generation", href: "/images", icon: ImageIcon },
  { title: "Video Generation", href: "/videos", icon: Film },
  { title: "AI Assistant", href: "/ai-assistant", icon: Bot, feature: "aiAssistant" },
  { title: "Analytics", href: "/analytics", icon: BarChart3, feature: "analytics" },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const QUICK_CREATE_ITEMS: (Omit<NavItem, "title"> & { title: string, description: string, feature?: string })[] = [
  {
    title: "Generate Ad",
    description: "Product swap studio",
    href: "/creator-studio",
    icon: Wand2,
  },
  {
    title: "Generate Image",
    description: "AI storyboard frames",
    href: "/images",
    icon: ImageIcon,
  },
  {
    title: "Create Video Ad",
    description: "From script to screen",
    href: "/videos",
    icon: Film,
  },
  {
    title: "Build Growth Engine",
    description: "Strategy to assets",
    href: "/growth-engine",
    icon: Rocket,
    feature: "growthEngine",
  },
];
