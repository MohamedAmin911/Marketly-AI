import { Types } from "mongoose";

import { AnalyticsModel, CampaignModel, connectToDatabase, GeneratedContentModel, GrowthProjectModel, ProjectModel, StoryboardModel, VideoModel, ViralEngineModel, AnalyticsEngineModel } from "@/server/database";
import type { AuthContext } from "@/server/security/auth-guard";

type DashboardMetric = {
  delta: string;
  label: string;
  tone: "danger" | "neutral" | "success" | "warning";
  value: string;
};

export type RecentGeneration = {
  caption?: string;
  color: string;
  createdAt?: string;
  description?: string;
  downloadUrl?: string;
  hook?: string;
  id: string;
  imageUrl?: string;
  isCampaign?: boolean;
  isStoryboard?: boolean;
  isVideo?: boolean;
  isViralEngine?: boolean;
  isAnalyticsEngine?: boolean;
  posts?: Array<{
    caption: string;
    id: string;
    platform: string;
    title: string;
    visualDirection: string;
  }>;
  title: string;
  type: string;
  videoUrl?: string;
};

type GenerationItemSources = {
  recentCampaigns: Array<{ _id: unknown; campaignCards?: unknown; campaignSummary?: string; campaignTitle?: string; createdAt?: unknown; generatedImages?: unknown; name: string; socialMode?: unknown; socialMoodPreset?: unknown; socialPosts?: unknown; socialTheme?: unknown }>;
  recentContent: Array<{ _id: unknown; createdAt?: unknown; generatedCaptions?: unknown; generatedHooks?: unknown; generatedImages: unknown; generationSettings?: { aspectRatio?: unknown }; prompt: string; type: string }>;
  recentGrowthProjects: Array<{ _id: unknown; brandName: string; createdAt?: unknown; productImage?: unknown }>;
  recentStoryboards: Array<{ _id: unknown; createdAt?: unknown; title: string }>;
  recentVideos: Array<{ _id: unknown; createdAt?: unknown; prompt?: unknown; selectedStyle?: unknown; thumbnailUrl?: unknown; title: string; videoUrl?: unknown }>;
  recentViralEngines: Array<{ _id: unknown; brandName: string; createdAt?: unknown }>;
  recentAnalyticsEngines: Array<{ _id: unknown; brandName: string; url: string; createdAt?: unknown }>;
};

export async function getDashboardSummary(auth: AuthContext) {
  const userId = toObjectId(auth.user.sub);

  if (!userId) {
    return emptyDashboard();
  }

  await connectToDatabase();

  const [projectCount, campaignCount, contentCount, storyboardCount, videoCount, viralCount, analyticsCount, analytics, recentContent, recentCampaigns, recentStoryboards, recentVideos, recentGrowthProjects, recentViralEngines, recentAnalyticsEngines] = await Promise.all([
    GrowthProjectModel.countDocuments({ userId }),
    CampaignModel.countDocuments({ userId }),
    GeneratedContentModel.countDocuments({ userId }),
    StoryboardModel.countDocuments({ userId }),
    VideoModel.countDocuments({ userId }),
    ViralEngineModel.countDocuments({ userId }),
    AnalyticsEngineModel.countDocuments({ userId }),
    AnalyticsModel.find({ userId }).sort({ createdAt: -1 }).limit(25).lean(),
    GeneratedContentModel.find({ userId }).sort({ createdAt: -1 }).limit(4).lean(),
    CampaignModel.find({ userId }).sort({ createdAt: -1 }).limit(4).lean(),
    StoryboardModel.find({ userId }).sort({ createdAt: -1 }).limit(4).lean(),
    VideoModel.find({ userId }).sort({ createdAt: -1 }).limit(4).lean(),
    GrowthProjectModel.find({ userId, status: { $ne: "draft" } }).sort({ createdAt: -1 }).limit(4).lean(),
    ViralEngineModel.find({ userId }).sort({ createdAt: -1 }).limit(4).lean(),
    AnalyticsEngineModel.find({ userId }).sort({ createdAt: -1 }).limit(4).lean(),
  ]);

  const clicks = analytics.reduce((total, item) => total + (item.clicks ?? 0), 0);
  const impressions = analytics.reduce((total, item) => total + (item.impressions ?? 0), 0);
  const conversions = analytics.reduce((total, item) => total + (item.conversions ?? 0), 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const recentGenerations = buildGenerationItems({ recentCampaigns, recentContent, recentGrowthProjects, recentStoryboards, recentVideos, recentViralEngines, recentAnalyticsEngines }).slice(0, 5);
  const growthTrend = buildGrowthTrend([...recentContent, ...recentCampaigns, ...recentGrowthProjects, ...recentStoryboards, ...recentVideos, ...recentViralEngines, ...recentAnalyticsEngines]);

  return {
    growthTrend,
    metrics: [
      metric("Projects", projectCount, "Active workspace projects"),
      metric("Generated Assets", contentCount + storyboardCount + videoCount, "Saved AI outputs"),
      {
        delta: analytics.length ? `${conversions.toLocaleString()} conversions` : "No analytics recorded yet",
        label: "Avg. Campaign CTR",
        tone: ctr > 0 ? "success" : "neutral",
        value: `${round(ctr)}%`,
      },
      metric("Campaigns", campaignCount, "Campaign records"),
      metric("Viral Engine", viralCount, "Viral engine generations"),
      metric("Analytics", analyticsCount, "Analytics engine generations"),
    ] satisfies DashboardMetric[],
    recentGenerations,
  };
}

export async function getDashboardGenerations(auth: AuthContext): Promise<{ items: RecentGeneration[] }> {
  const userId = toObjectId(auth.user.sub);

  if (!userId) {
    return { items: [] };
  }

  await connectToDatabase();

  const [recentContent, recentCampaigns, recentStoryboards, recentVideos, recentGrowthProjects, recentViralEngines, recentAnalyticsEngines] = await Promise.all([
    GeneratedContentModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    CampaignModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    StoryboardModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    VideoModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    GrowthProjectModel.find({ userId, status: { $ne: "draft" } }).sort({ createdAt: -1 }).limit(100).lean(),
    ViralEngineModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    AnalyticsEngineModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  return {
    items: buildGenerationItems({ recentCampaigns, recentContent, recentGrowthProjects, recentStoryboards, recentVideos, recentViralEngines, recentAnalyticsEngines }),
  };
}

function emptyDashboard() {
  return {
    growthTrend: [],
    metrics: [
      { delta: "Create your first project", label: "Projects", tone: "neutral", value: "0" },
      { delta: "Generate an asset to start history", label: "Generated Assets", tone: "neutral", value: "0" },
      { delta: "No analytics recorded yet", label: "Avg. Campaign CTR", tone: "neutral", value: "0%" },
      { delta: "No campaigns yet", label: "Campaigns", tone: "neutral", value: "0" },
      { delta: "No viral engine generations yet", label: "Viral Engine", tone: "neutral", value: "0" },
      { delta: "No analytics engine generations yet", label: "Analytics", tone: "neutral", value: "0" },
    ] satisfies DashboardMetric[],
    recentGenerations: [] satisfies RecentGeneration[],
  };
}

function buildGenerationItems({
  recentCampaigns,
  recentContent,
  recentGrowthProjects,
  recentStoryboards,
  recentVideos,
  recentViralEngines,
  recentAnalyticsEngines,
}: GenerationItemSources): RecentGeneration[] {
  return [
    ...recentAnalyticsEngines.map((item) => ({
      color: "from-blue-500/30 to-cyan-500/25",
      createdAt: toIso(item.createdAt),
      description: `Analysis for ${item.url}`,
      id: String(item._id),
      title: `Analytics: ${item.brandName}`,
      type: "AI Analytics Engine",
      isAnalyticsEngine: true,
    })),
    ...recentViralEngines.map((item) => ({
      color: "from-fuchsia-500/30 to-orange-500/25",
      createdAt: toIso(item.createdAt),
      description: `Viral Engine strategy for ${item.brandName}`,
      id: String(item._id),
      title: `Viral Engine: ${item.brandName}`,
      type: "Viral Engine",
      isViralEngine: true,
    })),
    ...recentGrowthProjects.map((item) => ({
      color: "from-blue-500/30 to-purple-500/25",
      createdAt: toIso(item.createdAt),
      description: `Growth Engine project for ${item.brandName}`,
      id: String(item._id),
      imageUrl: String((item.productImage as Record<string, unknown>)?.thumbnailUrl || (item.productImage as Record<string, unknown>)?.url || ""),
      title: `Growth Engine: ${item.brandName}`,
      type: "AI Growth Engine",
    })),
    ...recentContent.flatMap((item) => {
      const id = String(item._id);
      const images = extractImageRefs(item.generatedImages);
      const hooks = extractStrings(item.generatedHooks);
      const captions = extractStrings(item.generatedCaptions);
      const imageItems = item.type === "storyboard" && images.length > 1 ? images : images.slice(0, 1);

      if (imageItems.length === 0) {
        return [{
          color: "from-cyan-400/40 to-fuchsia-500/30",
          createdAt: toIso(item.createdAt),
          id,
          isStoryboard: item.type === "storyboard",
          title: titleForGeneratedContent(item.type, item.prompt),
          type: labelContentType(item.type),
        }];
      }

      return imageItems.map((image, index) => ({
        color: "from-cyan-400/40 to-fuchsia-500/30",
        caption: item.type === "storyboard" ? captions[index] : undefined,
        downloadUrl: `/api/dashboard/generations/${id}/download?imageIndex=${index}`,
        createdAt: toIso(item.createdAt),
        hook: item.type === "storyboard" ? hooks[index] : undefined,
        id: item.type === "storyboard" ? `${id}-${index}` : id,
        imageUrl: image.url,
        isStoryboard: item.type === "storyboard",
        title: titleForGeneratedContent(item.type, item.prompt, index),
        type: buildGeneratedContentType(item, index),
      }));
    }),
    ...recentCampaigns.map((item) => {
      const image = extractImageRefs(item.generatedImages)[0] ?? extractCampaignCardImage(item.campaignCards);
      const posts = extractCampaignPosts(item.socialPosts, item.campaignCards);
      const mood = typeof item.socialMoodPreset === "string" ? item.socialMoodPreset : undefined;
      const theme = typeof item.socialTheme === "string" ? item.socialTheme : item.campaignSummary;
      return {
        color: "from-violet-400/35 to-cyan-400/25",
        createdAt: toIso(item.createdAt),
        description: theme ? [theme, mood ? `Mood: ${mood}` : undefined].filter(Boolean).join(" | ") : item.campaignSummary,
        id: String(item._id),
        imageUrl: image?.url,
        isCampaign: true,
        posts,
        title: item.campaignTitle ?? item.name,
        type: item.socialMode === "custom" ? "Campaign - Custom Ideas" : "Campaign - Auto Scenarios",
      };
    }),
    ...recentStoryboards.map((item) => ({ color: "from-emerald-400/30 to-cyan-500/25", createdAt: toIso(item.createdAt), id: String(item._id), title: item.title, type: "Storyboard" })),
    ...recentVideos.map((item) => ({
      color: "from-emerald-400/30 to-cyan-500/25",
      createdAt: toIso(item.createdAt),
      description: stringValue(item.prompt),
      id: String(item._id),
      imageUrl: typeof item.thumbnailUrl === "string" ? item.thumbnailUrl : undefined,
      isVideo: true,
      title: item.title,
      type: typeof item.selectedStyle === "string" ? `Video - ${item.selectedStyle}` : "Video",
      videoUrl: typeof item.videoUrl === "string" ? item.videoUrl : undefined,
    })),
  ].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

function buildGrowthTrend(items: Array<{ createdAt?: unknown }>) {
  const buckets = new Map<string, { conversions: number; name: string; value: number }>();

  const sortedItems = [...items].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date().getTime();
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date().getTime();
    return dateA - dateB;
  });

  sortedItems.forEach((item) => {
    const date = item.createdAt instanceof Date ? item.createdAt : new Date();
    const name = new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(date);
    const current = buckets.get(name) ?? { conversions: 0, name, value: 0 };
    current.value += 1;
    current.conversions += 1;
    buckets.set(name, current);
  });

  return [...buckets.values()].slice(-8);
}

function metric(label: string, value: number, delta: string): DashboardMetric {
  return {
    delta,
    label,
    tone: value > 0 ? "success" : "neutral",
    value: value.toLocaleString(),
  };
}

function labelContentType(type: string) {
  return type.split("-").map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ");
}

function buildGeneratedContentType(item: GenerationItemSources["recentContent"][number], index: number) {
  const label = labelContentType(item.type);
  const suffix = item.type === "storyboard" ? `Frame ${index + 1}` : undefined;
  const aspect = typeof item.generationSettings?.aspectRatio === "string" ? item.generationSettings.aspectRatio : undefined;

  return [label, suffix, aspect].filter(Boolean).join(" - ");
}

function titleForGeneratedContent(type: string, prompt: string, index = 0) {
  if (type === "storyboard") return `AI Cinematic Storyboard Frame ${index + 1}`;
  if (prompt.includes("The FIRST uploaded image is the target product.")) return "AI Product Advertisement";
  return prompt.slice(0, 80);
}

function extractImageRefs(images: unknown): Array<{ mimeType?: string; url: string }> {
  if (!Array.isArray(images)) return [];

  return images.flatMap((image) => {
    if (!image || typeof image !== "object") return [];
    const candidate = image as { mimeType?: unknown; url?: unknown };
    if (typeof candidate.url !== "string") return [];

    return [{
      mimeType: typeof candidate.mimeType === "string" ? candidate.mimeType : undefined,
      url: candidate.url,
    }];
  });
}

function extractCampaignCardImage(cards: unknown): { url: string } | undefined {
  if (!Array.isArray(cards)) return undefined;
  for (const card of cards) {
    if (!card || typeof card !== "object") continue;
    const image = (card as { generatedImage?: { url?: unknown } }).generatedImage;
    if (typeof image?.url === "string") return { url: image.url };
  }
  return undefined;
}

function extractCampaignPosts(primary: unknown, fallback: unknown): RecentGeneration["posts"] {
  if (Array.isArray(primary) && primary.length > 0) {
    return primary.flatMap((post) => {
      if (!post || typeof post !== "object") return [];
      const record = post as Record<string, unknown>;
      return [{
        caption: stringValue(record.caption),
        id: stringValue(record.id, crypto.randomUUID()),
        platform: stringValue(record.platform),
        title: stringValue(record.title),
        visualDirection: stringValue(record.visualDirection),
      }];
    });
  }

  if (!Array.isArray(fallback)) return [];
  return fallback.flatMap((card) => {
    if (!card || typeof card !== "object") return [];
    const record = card as Record<string, unknown>;
    return [{
      caption: stringValue(record.caption),
      id: stringValue(record.id, crypto.randomUUID()),
      platform: stringValue(record.platform),
      title: stringValue(record.hook),
      visualDirection: stringValue(record.creativePrompt),
    }];
  });
}

function extractStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

function toObjectId(value: string) {
  return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}
