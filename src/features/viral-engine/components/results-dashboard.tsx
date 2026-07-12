"use client";

import { motion } from "framer-motion";
import { 
  LayoutDashboard, Lightbulb, CalendarRange, ThumbsUp, Camera, Hash, 
  Music2, Users, Clapperboard, Images, MousePointerClick, TrendingUp, Presentation,
  Target, BarChart3, MessageSquareQuote
} from "lucide-react";
import { ViralEngineResponse } from "@/types/viral-engine";
import { ViralSection } from "./viral-section";
import { IdeaGrid } from "./idea-grid";
import { ScheduleTable } from "./schedule-table";
import { CompetitorTable } from "./competitor-table";
import { TrendingTopics } from "./trending-topics";
import { HooksGrid } from "./hooks-grid";
import { HashtagCloud } from "./hashtag-cloud";
import { RecommendationsCard } from "./recommendations-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ResultsDashboardProps {
  data: ViralEngineResponse;
}

export function ResultsDashboard({ data }: ResultsDashboardProps) {
  const { t } = useTranslation();
  const ve = data.viralEngine;
  if (!ve) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-24"
    >
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview" className="flex gap-2 items-center">
              <LayoutDashboard className="size-4" />
              {t("viralEngine.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex gap-2 items-center">
              <Lightbulb className="size-4" />
              {t("viralEngine.tabs.content")}
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex gap-2 items-center">
              <CalendarRange className="size-4" />
              {t("viralEngine.tabs.strategy")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-12 mt-6">
          {ve.marketSummary && (
            <ViralSection title={t("viralEngine.overview.marketSummary")} data={ve.marketSummary}>
              <div className="p-6 rounded-lg border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground/90">{ve.marketSummary}</p>
              </div>
            </ViralSection>
          )}

          {ve.currentTrends && ve.currentTrends.length > 0 && (
            <ViralSection title={t("viralEngine.overview.trendingTopics")} data={ve.currentTrends}>
              <TrendingTopics topics={ve.currentTrends} />
            </ViralSection>
          )}

          {ve.competitors && ve.competitors.length > 0 && (
            <ViralSection title={t("viralEngine.overview.competitors")} data={ve.competitors}>
              <CompetitorTable competitors={ve.competitors} />
            </ViralSection>
          )}
        </TabsContent>

        {/* CONTENT IDEAS TAB */}
        <TabsContent value="ideas" className="space-y-12 mt-6">
          {ve.viralHooks && ve.viralHooks.length > 0 && (
            <ViralSection title={t("viralEngine.content.viralHooks")} data={ve.viralHooks}>
              <HooksGrid hooks={ve.viralHooks} />
            </ViralSection>
          )}

          <div className="flex flex-col gap-12">
            {ve.facebookIdeas && ve.facebookIdeas.length > 0 && (
              <ViralSection 
                title={<div className="flex items-center gap-2"><ThumbsUp className="size-5 text-blue-500" /> {t("viralEngine.content.facebookIdeas")}</div>} 
                data={ve.facebookIdeas}
              >
                <IdeaGrid ideas={ve.facebookIdeas} />
              </ViralSection>
            )}

            {ve.instagramIdeas && ve.instagramIdeas.length > 0 && (
              <ViralSection 
                title={<div className="flex items-center gap-2"><Camera className="size-5 text-pink-500" /> {t("viralEngine.content.instagramIdeas")}</div>} 
                data={ve.instagramIdeas}
              >
                <IdeaGrid ideas={ve.instagramIdeas} />
              </ViralSection>
            )}

            {ve.tiktokIdeas && ve.tiktokIdeas.length > 0 && (
              <ViralSection 
                title={<div className="flex items-center gap-2"><Music2 className="size-5" /> {t("viralEngine.content.tiktokIdeas")}</div>} 
                data={ve.tiktokIdeas}
              >
                <IdeaGrid ideas={ve.tiktokIdeas} />
              </ViralSection>
            )}

            {ve.ugcIdeas && ve.ugcIdeas.length > 0 && (
              <ViralSection 
                title={<div className="flex items-center gap-2"><Users className="size-5 text-emerald-500" /> UGC Ideas</div>} 
                data={ve.ugcIdeas}
              >
                <IdeaGrid ideas={ve.ugcIdeas} />
              </ViralSection>
            )}

            {ve.videoConcepts && ve.videoConcepts.length > 0 && (
              <ViralSection 
                title={<div className="flex items-center gap-2"><Clapperboard className="size-5 text-purple-500" /> Video Concepts</div>} 
                data={ve.videoConcepts}
              >
                <IdeaGrid ideas={ve.videoConcepts} />
              </ViralSection>
            )}

            {ve.carouselIdeas && ve.carouselIdeas.length > 0 && (
              <ViralSection 
                title={<div className="flex items-center gap-2"><Images className="size-5 text-amber-500" /> Carousel Ideas</div>} 
                data={ve.carouselIdeas}
              >
                <IdeaGrid ideas={ve.carouselIdeas} />
              </ViralSection>
            )}
            
            {ve.ctaIdeas && ve.ctaIdeas.length > 0 && (
              <ViralSection 
                title={<div className="flex items-center gap-2"><MousePointerClick className="size-5 text-orange-500" /> Call-to-Action Ideas</div>} 
                data={ve.ctaIdeas}
              >
                <IdeaGrid ideas={ve.ctaIdeas} />
              </ViralSection>
            )}
          </div>
        </TabsContent>

        {/* STRATEGY TAB */}
        <TabsContent value="strategy" className="space-y-12 mt-6">
          {ve.recommendations && (
            <ViralSection title={t("viralEngine.strategy.strategicRecommendations")} data={ve.recommendations}>
              <RecommendationsCard recommendations={ve.recommendations} />
            </ViralSection>
          )}

          {ve.postingSchedule && ve.postingSchedule.length > 0 && (
            <ViralSection title={t("viralEngine.strategy.postingSchedule")} data={ve.postingSchedule}>
              <ScheduleTable schedule={ve.postingSchedule} />
            </ViralSection>
          )}

          {ve.hashtags && ve.hashtags.length > 0 && (
            <ViralSection title={t("viralEngine.overview.trendingHashtags")} data={ve.hashtags}>
              <HashtagCloud hashtags={ve.hashtags} />
            </ViralSection>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
