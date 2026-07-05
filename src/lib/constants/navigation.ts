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
  { title: "Dashboard", translationKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Ad Studio", translationKey: "nav.adStudio", href: "/creator-studio", icon: Grid2X2 },
  { title: "AI Growth Engine", translationKey: "nav.growthEngine", href: "/growth-engine", icon: Rocket, feature: "growthEngine" },
  { title: "Image Generation", translationKey: "nav.imageGeneration", href: "/images", icon: ImageIcon },
  { title: "Video Generation", translationKey: "nav.videoGeneration", href: "/videos", icon: Film },
  { title: "AI Assistant", translationKey: "nav.aiAssistant", href: "/ai-assistant", icon: Bot, feature: "aiAssistant" },
  { title: "Analytics", translationKey: "nav.analytics", href: "/analytics", icon: BarChart3, feature: "analytics" },
  { title: "Settings", translationKey: "nav.settings", href: "/settings", icon: Settings },
  { title: "Admin Panel", translationKey: "nav.adminPanel", href: "/admin", icon: Settings, role: "admin" },
];

export const QUICK_CREATE_ITEMS: (Omit<NavItem, "title"> & { title: string, description: string, feature?: string })[] = [
  {
    title: "Generate Ad",
    translationKey: "quick.generateAd",
    description: "Product swap studio",
    descriptionKey: "quick.generateAdDesc",
    href: "/creator-studio",
    icon: Wand2,
  },
  {
    title: "Generate Image",
    translationKey: "quick.generateImage",
    description: "AI storyboard frames",
    descriptionKey: "quick.generateImageDesc",
    href: "/images",
    icon: ImageIcon,
  },
  {
    title: "Create Video Ad",
    translationKey: "quick.createVideoAd",
    description: "From script to screen",
    descriptionKey: "quick.createVideoAdDesc",
    href: "/videos",
    icon: Film,
  },
  {
    title: "Build Growth Engine",
    translationKey: "quick.buildGrowthEngine",
    description: "Strategy to assets",
    descriptionKey: "quick.buildGrowthEngineDesc",
    href: "/growth-engine",
    icon: Rocket,
    feature: "growthEngine",
  },
  {
    title: "Contact Support",
    translationKey: "contact.title",
    description: "Get help from our team",
    descriptionKey: "contact.desc",
    href: "/contact",
    icon: Bot,
  },
] as const;
