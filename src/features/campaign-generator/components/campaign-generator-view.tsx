"use client";

import {
  Download,
  ImageUp,
  Loader2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/features/campaign-generator/components/campaign-card";
import { useCampaignAds } from "@/features/campaign-generator/hooks/use-campaign-ads";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

const moods = [
  "Original",
  "Minimalist White",
  "Dark Luxury",
  "Pastel Pop",
  "Nature Green",
  "Ocean Blue",
  "Warm Gold",
  "Cyberpunk Neon",
];
export function CampaignGeneratorView() {
  const { t } = useTranslation();
  const { campaign, copyPost, downloadCopy, error, generate, isGenerating } =
    useCampaignAds();
  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [productFile, setProductFile] = useState<File | null>(null);
  const [theme, setTheme] = useState("");
  const [moodPreset, setMoodPreset] = useState("Original");
  const [customIdeas, setCustomIdeas] = useState(["", "", "", "", "", ""]);
  const [formError, setFormError] = useState("");

  const canGenerate = Boolean(productFile && theme.trim() && !isGenerating);

  async function submitGeneration() {
    if (!productFile) {
      setFormError(t("campaign.uploadReferenceError"));
      return;
    }
    if (!theme.trim()) {
      setFormError(t("campaign.themeError"));
      return;
    }

    setFormError("");
    await generate({
      customIdeas: customIdeas.map((idea) => idea.trim()).filter(Boolean),
      mode,
      moodPreset,
      productFile,
      theme,
    });
  }

  return (
    <PageShell title="" description="" className="max-w-[1660px]">
      <div className="relative -mx-4 min-h-[calc(100vh-8rem)] overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(114,255,95,0.16),transparent_34%),linear-gradient(180deg,#031004_0%,#061208_46%,#020902_100%)] px-4 py-4 sm:px-8">
        <div className="mx-auto mb-10 flex w-fit rounded-2xl border border-white/10 bg-black/35 p-1.5 shadow-[0_0_50px_rgba(0,0,0,0.45)] backdrop-blur">
          <SegmentButton
            active={mode === "auto"}
            onClick={() => setMode("auto")}
          >
            {t("campaign.autoScenarios")}
          </SegmentButton>
          <SegmentButton
            active={mode === "custom"}
            onClick={() => setMode("custom")}
          >
            {t("campaign.customIdeas")}
          </SegmentButton>
        </div>

        <div className="glass-panel mx-auto grid max-w-[1560px] gap-10 rounded-[32px] p-8 xl:grid-cols-[360px_minmax(0,1fr)] xl:p-10">
          <aside>
            <p className="mb-5 text-center font-mono text-xs font-bold uppercase tracking-[0.34em] text-white/45">
              {t("campaign.productReference")}
            </p>
            <label className="group relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-primary/70 bg-black/30 shadow-[0_0_46px_rgba(114,255,95,0.08)] transition hover:border-primary hover:shadow-glow">
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  setProductFile(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
              {productFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(productFile)}
                  alt={t("campaign.productReference")}
                  className="size-full object-cover opacity-90"
                />
              ) : (
                <div className="text-center">
                  <UploadCloud className="mx-auto mb-5 size-12 text-white/70" />
                  <p className="text-base font-medium text-white/70">
                    {t("campaign.uploadImage")}
                  </p>
                  <p className="mt-2 text-sm text-white/40">{t("campaign.dragDrop")}</p>
                </div>
              )}
            </label>
          </aside>

          <main className="min-w-0">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-6">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-white">
                  {mode === "auto"
                    ? t("campaign.socialStudio")
                    : t("campaign.customStudio")}
                </h1>
                <p className="mt-3 text-base text-white/45">
                  {mode === "auto"
                    ? t("campaign.socialDesc")
                    : t("campaign.customDesc")}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => void submitGeneration()}
                disabled={!canGenerate}
                className="neon-gradient h-16 rounded-xl px-10 text-base font-bold text-[#021003] shadow-glow disabled:opacity-45"
              >
                {isGenerating ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Sparkles className="size-5" />
                )}
                {mode === "auto"
                  ? t("campaign.generateFeedPosts")
                  : t("campaign.generateCustomPosts")}
              </Button>
            </div>

            <label className="block rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
              <span className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                <ImageUp className="size-4" />
                {t("campaign.designTheme")}
              </span>
              <textarea
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="min-h-24 w-full resize-none bg-transparent text-base leading-7 text-white outline-none placeholder:text-white/25"
                placeholder={t("campaign.themePlaceholder")}
              />
            </label>

            {mode === "auto" ? (
              <section className="mt-8">
                <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.22em] text-white/35">
                  {t("campaign.quickMoodPreset")}
                </p>
                <div className="flex flex-wrap gap-3">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setMoodPreset(mood)}
                      className={cn(
                        "rounded-full border border-primary/10 bg-black/30 px-7 py-3 text-sm font-bold text-white/48 transition hover:border-primary/50 hover:text-white hover:shadow-[0_0_30px_rgba(114,255,95,0.12)]",
                        moodPreset === mood &&
                          "border-primary bg-primary text-[#021003] shadow-glow",
                      )}
                    >
                      {translateMood(mood, t)}
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {customIdeas.map((idea, index) => (
                  <label key={index} className="block">
                    <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                      {t("campaign.customIdea", { number: index + 1 })}
                    </span>
                    <textarea
                      value={idea}
                      onChange={(event) =>
                        setCustomIdeas((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        )
                      }
                      className="min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm leading-5 text-white outline-none transition placeholder:text-white/28 focus:border-primary/60 focus:shadow-[0_0_30px_rgba(114,255,95,0.12)]"
                      placeholder={t("campaign.ideaPlaceholder", { example: translateIdeaExample(index, t) })}
                    />
                  </label>
                ))}
              </section>
            )}

            {formError || error ? (
              <p className="mt-5 rounded-xl border border-primary/25 bg-primary/10 p-4 text-sm text-foreground">
                {formError || error}
              </p>
            ) : null}
          </main>
        </div>

        {campaign ? (
          <section className="mx-auto mt-10 max-w-[1560px]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-primary">
                  {t("campaign.generatedConcepts")}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                  {t("campaign.feedPosts")}
                </h2>
              </div>
              <Button variant="secondary" type="button" onClick={downloadCopy}>
                <Download className="size-4" />
                {t("campaign.exportPosts")}
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {campaign.posts.map((post) => (
                <CampaignCard
                  key={post.id}
                  post={post}
                  onCopy={() => void copyPost(post)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}

function translateMood(mood: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (mood === "Original") return t("campaign.moodOriginal");
  if (mood === "Minimalist White") return t("campaign.moodMinimalistWhite");
  if (mood === "Dark Luxury") return t("campaign.moodDarkLuxury");
  if (mood === "Pastel Pop") return t("campaign.moodPastelPop");
  if (mood === "Nature Green") return t("campaign.moodNatureGreen");
  if (mood === "Ocean Blue") return t("campaign.moodOceanBlue");
  if (mood === "Warm Gold") return t("campaign.moodWarmGold");
  if (mood === "Cyberpunk Neon") return t("campaign.moodCyberpunkNeon");
  return mood;
}

function translateIdeaExample(index: number, t: ReturnType<typeof useTranslation>["t"]) {
  const keys = [
    "campaign.ideaExample1",
    "campaign.ideaExample2",
    "campaign.ideaExample3",
    "campaign.ideaExample4",
    "campaign.ideaExample5",
    "campaign.ideaExample6",
  ] as const;

  return t(keys[index] ?? "campaign.ideaExample1");
}

function SegmentButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-44 rounded-xl px-8 py-4 text-sm font-bold text-white/42 transition",
        active && "neon-gradient text-[#021003] shadow-glow",
      )}
    >
      {children}
    </button>
  );
}
