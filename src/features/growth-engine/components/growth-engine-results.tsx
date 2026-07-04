"use client";

import { Activity, AlertTriangle, ArrowRight, Lightbulb, LineChart, Milestone, Rocket, ShieldAlert, Target, Users, Zap, ImageIcon, Video, WandSparkles } from "lucide-react";
import Link from "next/link";

import { WorkflowSection } from "@/features/growth-engine/components/workflow-section";
import { Button } from "@/components/ui/button";
import {
  getPrimaryImageGenerationPreset,
  encodeImageGenerationState,
} from "@/features/growth-engine/services/image-generation-adapter";
import type { GrowthProjectRecord } from "@/features/growth-engine/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type SectionStatus = "empty" | "loading" | "success" | "error";

function sectionStatus(
  hasData: boolean,
  isLoading: boolean,
  error: string | undefined,
): SectionStatus {
  if (error) return "error";
  if (isLoading) return "loading";
  if (hasData) return "success";
  return "empty";
}

export function GrowthEngineResults({
  liveProject,
  submitting = false,
}: {
  liveProject: GrowthProjectRecord | null;
  submitting?: boolean;
}) {
  const { t } = useTranslation();
  const strategy = toRecord(liveProject?.strategy);
  const swot = toRecord(strategy?.swot);
  const personas = arrayOfRecords(strategy?.personas).length ? arrayOfRecords(strategy?.personas) : liveProject?.personas ?? [];
  const recommendedActions = arrayOfUnknown(strategy?.recommendations).length ? arrayOfUnknown(strategy?.recommendations) : liveProject?.marketingAngles ?? [];
  const campaigns = liveProject?.campaigns ?? [];
  const storyboards = liveProject?.storyboards ?? [];
  const hasStrategySummary = Boolean(liveProject?.strategy);

  return (
    <div className="space-y-5">
      <WorkflowSection
        title={t("growth.strategyOverview")}
        description={t("growth.strategyOverviewDesc")}
        status={sectionStatus(hasStrategySummary, submitting, undefined)}
        emptyTitle={t("growth.noStrategy")}
        emptyDescription={t("growth.noStrategyDesc")}
      >
        {liveProject?.strategy ? (
          <div className="space-y-6">
            {/* Check if it's an object with swot/personas, else generic */}
            {typeof liveProject.strategy === "object" && !Array.isArray(liveProject.strategy) && liveProject.strategy !== null ? (
              (() => {
                const strategy = liveProject.strategy as Record<string, unknown>;
                const personas = Array.isArray(strategy.personas) ? strategy.personas : [];
                const recommendations = Array.isArray(strategy.recommendations) ? strategy.recommendations : [];

                // Resolve launch plan from multiple possible key names and shapes
                function extractLaunchPlan(s: Record<string, unknown>): Record<string, unknown>[] {
                  const raw =
                    s.launchPlan ??
                    s.launch_plan ??
                    s.roadmap ??
                    s.timeline ??
                    s.phases ??
                    null;

                  // Array of phase objects: [{phase, timeline, actions}] or [{focus, months, activities}]
                  if (Array.isArray(raw)) return raw as Record<string, unknown>[];

                  // Object with phase_1, phase_2... keys: { phase_1: {...}, phase_2: {...} }
                  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
                    return Object.values(raw as Record<string, unknown>) as Record<string, unknown>[];
                  }

                  // Try top-level keys named phase_N
                  const phaseKeys = Object.keys(s).filter((k) => /^phase[_\d]/.test(k));
                  if (phaseKeys.length > 0) {
                    return phaseKeys.map((k) => s[k] as Record<string, unknown>);
                  }

                  return [];
                }

                const launchPlan = extractLaunchPlan(strategy);

                // Convert a recommendation to a displayable string (handles objects too)
                function recToString(rec: unknown): string {
                  if (typeof rec === "string") return rec;
                  if (rec && typeof rec === "object") {
                    const obj = rec as Record<string, unknown>;
                    // Try common text keys
                    const text = obj.recommendation ?? obj.text ?? obj.title ?? obj.description ?? obj.action ?? obj.suggestion ?? obj.content;
                    if (typeof text === "string") return text;
                    // Fallback: join all string values
                    return Object.values(obj).filter((v) => typeof v === "string").join(" — ") || JSON.stringify(rec);
                  }
                  return String(rec);
                }

                return (
                  <>
                    {/* SWOT Analysis */}
                    {strategy.swot && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Activity className="size-4 text-primary" /> {t("growth.swotAnalysis")}
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            "strengths",
                            "weaknesses",
                            "opportunities",
                            "threats",
                          ].map((key) => {
                            const items = strategy.swot as Record<
                              string,
                              unknown
                            >;
                            if (
                              !items ||
                              !items[key] ||
                              !Array.isArray(items[key])
                            )
                              return null;
                            const arr = items[key] as string[];
                            if (arr.length === 0) return null;
                            return (
                              <div
                                key={key}
                                className="rounded-lg border border-primary/10 bg-primary/[0.03] p-4 transition-colors hover:border-primary/20 hover:bg-primary/[0.05]"
                              >
                                <h5 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary/70">
                                  {key === "strengths" && (
                                    <Zap className="size-3 text-green-400" />
                                  )}
                                  {key === "weaknesses" && (
                                    <AlertTriangle className="size-3 text-red-400" />
                                  )}
                                  {key === "opportunities" && (
                                    <LineChart className="size-3 text-blue-400" />
                                  )}
                                  {key === "threats" && (
                                    <ShieldAlert className="size-3 text-orange-400" />
                                  )}
                                  {key}
                                </h5>
                                <ul className="space-y-2">
                                  {arr.map((item: string, idx: number) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2 text-sm leading-5 text-muted-foreground"
                                    >
                                      <span className="mt-[2px] block size-1.5 shrink-0 rounded-full bg-primary/40" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Personas */}
                    {personas.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Users className="size-4 text-primary" /> {t("growth.targetPersonas")}
                        </h4>
                        <div className="grid gap-3 md:grid-cols-3">
                          {personas.map((persona: Record<string, unknown>, i: number) => (
                            <div key={i} className="group flex flex-col rounded-lg border border-primary/15 bg-gradient-to-b from-primary/[0.05] to-transparent p-4">
                              <p className="font-mono text-[10px] text-primary/50">{t("growth.persona", { number: i + 1 })}</p>
                              <p className="mt-1 font-semibold text-foreground group-hover:text-primary transition-colors">{String(persona.name)}</p>
                              <p className="mt-2 text-xs leading-5 text-muted-foreground">{String(persona.description ?? persona.bio ?? persona.role ?? persona.details ?? persona.summary ?? persona.background ?? "")}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Lightbulb className="size-4 text-primary" />{" "}
                          {t("analytics.recommendation")}
                        </h4>
                        <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-5">
                          <ul className="space-y-3">
                            {recommendations.map((rec: unknown, i: number) => (
                              <li
                                key={i}
                                className="flex items-start gap-3 text-sm leading-6 text-foreground/90"
                              >
                                <Target className="mt-1 size-4 shrink-0 text-primary" />
                                <span>{recToString(rec)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Launch Plan */}
                    {launchPlan.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Milestone className="size-4 text-primary" /> {t("growth.launchTimeline")}
                        </h4>
                        <div className="space-y-3">
                          {launchPlan.map((phase: Record<string, unknown>, i: number) => {
                              const label = String(phase.focus ?? phase.phase ?? `Phase ${i + 1}`);
                              const timeline = String(phase.months ?? phase.timeline ?? "");
                              const items: unknown[] = Array.isArray(phase.activities)
                                ? phase.activities
                                : Array.isArray(phase.actions)
                                ? phase.actions
                                : [];
                              return (
                                <div key={i} className="relative overflow-hidden rounded-lg border border-primary/15 bg-primary/[0.03] p-5">
                                  <div className="absolute start-0 top-0 h-full w-1 bg-primary/40" />
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                                    <h5 className="font-semibold text-foreground">{label}</h5>
                                    {timeline && (
                                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                        {timeline}
                                      </span>
                                    )}
                                  </div>
                                  <ul className="grid gap-2 sm:grid-cols-2">
                                    {items.map((action: unknown, j: number) => (
                                      <li key={j} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                                        <ArrowRight className="mt-[3px] size-3 shrink-0 text-primary/60" />
                                        {String(action)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              /* Fallback for other formats (string or unknown shape) */
              <div className="space-y-2">
                {typeof liveProject.strategy === "string" ? (
                  <p className="text-sm leading-6 text-foreground">
                    {liveProject.strategy}
                  </p>
                ) : Array.isArray(liveProject.strategy) ? (
                  <div className="space-y-2">
                    {(liveProject.strategy as unknown[]).map((item, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3 text-sm text-foreground"
                      >
                        {typeof item === "string"
                          ? item
                          : JSON.stringify(item, null, 2)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(
                      liveProject.strategy as Record<string, unknown>,
                    ).map(([key, val]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3"
                      >
                        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                          {key}
                        </p>
                        <p className="text-sm leading-6 text-foreground">
                          {typeof val === "string"
                            ? val
                            : JSON.stringify(val, null, 2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </WorkflowSection>

      <WorkflowSection
        title={t("growth.campaignConcepts")}
        description={t("growth.campaignConceptsDesc")}
        status={sectionStatus(campaigns.length > 0, submitting, undefined)}
        emptyTitle={t("growth.noCampaignConcepts")}
        emptyDescription={t("growth.noCampaignConceptsDesc")}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {liveProject?.campaigns.map((campaign: unknown, i: number) => {
            const c = campaign as Record<string, unknown>;
            const title = c.title ?? c.name ?? `Campaign ${i + 1}`;
            const objective = c.objective ?? c.description ?? c.hook ?? "";
            const platform = c.platform ?? "";
            const tone = c.tone ?? "";
            return (
              <div
                key={i}
                className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4"
              >
                <Rocket className="mb-2 size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {String(title)}
                </p>
                {platform ? (
                  <p className="mt-0.5 text-[10px] font-mono text-primary/70">
                    {String(platform)}
                  </p>
                ) : null}
                <p className="mt-1 text-xs leading-5 text-muted">
                  {String(objective)}
                </p>
                {tone ? (
                  <p className="mt-1 text-[10px] text-muted/60 italic">
                    {String(tone)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </WorkflowSection>

      <WorkflowSection
        title={t("growth.storyboards")}
        description={t("growth.storyboardsDesc")}
        status={sectionStatus(storyboards.length > 0, submitting, undefined)}
        emptyTitle={t("growth.noStoryboards")}
        emptyDescription={t("growth.noStoryboardsDesc")}
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {liveProject?.storyboards.flatMap((board: unknown, campIdx: number) => {
            // Normalize board into flat array of scene objects
            let scenes: Record<string, unknown>[] = [];
            if (Array.isArray(board)) {
              scenes = board as Record<string, unknown>[];
            } else {
              const b = board as Record<string, unknown>;
              if (Array.isArray(b.scenes)) {
                scenes = b.scenes as Record<string, unknown>[];
              } else {
                scenes = [b];
              }
            }

            return scenes.map((scene, sceneIdx) => {
              const s = scene as Record<string, unknown>;
              const num = s.scene_number ?? sceneIdx + 1;
              const title = String(s.title ?? s.sceneTitle ?? s.scene_title ?? `Scene ${num}`);
              const imagePrompt = String(s.imagePrompt ?? s.image_prompt ?? s.visual ?? s.prompt ?? "");
              const videoPrompt = String(s.videoPrompt ?? s.video_prompt ?? s.action ?? s.script ?? s.narration ?? s.description ?? "");
              // Optional fields
              const audio = String(s.audio ?? "");
              const textOverlay = String(s.text_overlay ?? s.textOverlay ?? "");
              const duration = String(s.duration ?? "");
              const imageUrl = String(s.generatedImage ?? s.imageUrl ?? s.image_url ?? "");

              return (
                <div key={`${campIdx}-${sceneIdx}`} className="rounded-lg border border-primary/15 bg-black/20 p-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                      {t("growth.campaign", { number: campIdx + 1 })} · {t("growth.scene", { number: String(num) })}
                    </p>
                    <div className="flex items-center gap-2">
                      {duration ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">{duration}</span>
                      ) : null}
                      <Link
                        href={`/images?prompt=${encodeURIComponent(imagePrompt || "")}&videoPrompt=${encodeURIComponent(videoPrompt || "")}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold text-primary hover:bg-primary/30 transition-colors"
                      >
                        <WandSparkles className="size-3" />
                        {t("growth.generateScene")}
                      </Link>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-foreground/90">{title}</p>

                  {/* Generated image if available */}
                  {imageUrl && imageUrl !== "undefined" ? (
                    <div className="overflow-hidden rounded-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt={title} className="w-full object-cover" loading="lazy" />
                    </div>
                  ) : null}

                  {/* Image Prompt */}
                  {imagePrompt && imagePrompt !== "undefined" ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{t("growth.imagePrompt")}</p>
                      </div>
                      <p className="text-xs leading-5 text-muted">{imagePrompt}</p>
                    </div>
                  ) : null}

                  {/* Video Prompt */}
                  {videoPrompt && videoPrompt !== "undefined" ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{t("growth.videoPrompt")}</p>
                      </div>
                      <p className="text-xs leading-5 text-muted">{videoPrompt}</p>
                    </div>
                  ) : null}

                  {/* Audio */}
                  {audio && audio !== "undefined" ? (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{t("growth.audio")}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{audio}</p>
                    </div>
                  ) : null}

                  {/* Text Overlay */}
                  {textOverlay && textOverlay !== "undefined" ? (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{t("growth.textOverlay")}</p>
                      <p className="mt-1 text-xs leading-5 text-muted italic">{textOverlay}</p>
                    </div>
                  ) : null}
                </div>
              );
            });
          })}
        </div>
      </WorkflowSection>
    </div>
  );
}

function RecommendedActions({ actions }: { actions: unknown[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {actions.map((action, index) => (
        <div key={index} className="flex gap-3 rounded-lg border border-border bg-surface p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            {index % 2 === 0 ? <Target className="size-4" /> : <Rocket className="size-4" />}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Action {index + 1}</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{stringifyValue(action)}</p>
          </div>
          <ArrowRight className="ms-auto mt-1 size-4 shrink-0 text-muted rtl:rotate-180" />
        </div>
      ))}
    </div>
  );}

function toRecord(val: unknown): Record<string, unknown> | null {
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return null;
}

function arrayOfRecords(val: unknown): Record<string, unknown>[] {
  if (Array.isArray(val)) {
    return val.filter((item) => typeof item === "object" && item !== null && !Array.isArray(item)) as Record<string, unknown>[];
  }
  return [];
}

function arrayOfUnknown(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  return [];
}

function stringifyValue(val: unknown): string {
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    const text = obj.recommendation ?? obj.text ?? obj.title ?? obj.description ?? obj.action ?? obj.suggestion ?? obj.content;
    if (typeof text === "string") return text;
    return Object.values(obj).filter((v) => typeof v === "string").join(" — ") || JSON.stringify(val);
  }
  return String(val);
}
