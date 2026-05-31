import {
  BarChart3,
  Bot,
  Clapperboard,
  Film,
  Grid2X2,
  LayoutDashboard,
  Megaphone,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";

import type { NavItem } from "@/types/navigation";

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Ad Studio", href: "/creator-studio", icon: Grid2X2 },
  { title: "Storyboard", href: "/storyboard", icon: Clapperboard },
  { title: "Campaign Generator", href: "/campaign-generator", icon: Sparkles },
  { title: "Video Generator", href: "/video-generator", icon: Film },
  { title: "Marketing Strategy", href: "/marketing-strategy", icon: Megaphone },
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
    title: "Create Video Ad",
    description: "From script to screen",
    href: "/video-generator",
    icon: Film,
  },
  {
    title: "Write Copy",
    description: "High-converting text",
    href: "/campaign-generator",
    icon: Sparkles,
  },
];
