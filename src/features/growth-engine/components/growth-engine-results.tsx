import { Activity, AlertTriangle, ArrowRight, Lightbulb, LineChart, Milestone, Rocket, ShieldAlert, Target, Users, Zap, ImageIcon } from "lucide-react";
import Link from "next/link";
import type { GrowthProjectRecord, SectionStatus } from "@/features/growth-engine/types";
import { WorkflowSection } from "@/features/growth-engine/components/workflow-section";

function sectionStatus(hasData: boolean, isLoading: boolean, error: string | undefined): SectionStatus {
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
  const hasStrategy = Boolean(liveProject?.strategy);
  const hasCampaigns = Boolean(liveProject?.campaigns?.length);
  const hasStoryboards = Boolean(liveProject?.storyboards?.length);

  return (
    <div className="space-y-5">
      {/* strategy */}
      <WorkflowSection
        title="Marketing Strategy"
        description="AI-generated SWOT, personas, and recommendations"
        status={sectionStatus(hasStrategy, submitting, undefined)}
        emptyTitle="No Strategy Yet"
        emptyDescription="Submit your brand brief to generate a marketing strategy."
      >
        {liveProject?.strategy ? (
          <div className="space-y-6">
            {/* Check if it's an object with swot/personas, else generic */}
            {typeof liveProject.strategy === "object" && !Array.isArray(liveProject.strategy) && "swot" in (liveProject.strategy || {}) ? (
              (() => {
                const strategy = liveProject.strategy as Record<string, unknown>;
                const personas = Array.isArray(strategy.personas) ? strategy.personas : [];
                const recommendations = Array.isArray(strategy.recommendations) ? strategy.recommendations : [];
                const launchPlan = Array.isArray(strategy.launchPlan) ? strategy.launchPlan : [];
                
                return (
                  <>
                    {/* SWOT Analysis */}
                    {(strategy.swot) && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Activity className="size-4 text-primary" /> SWOT Analysis
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {["strengths", "weaknesses", "opportunities", "threats"].map((key) => {
                            const items = strategy.swot as Record<string, unknown>;
                            if (!items || !items[key] || !Array.isArray(items[key])) return null;
                            const arr = items[key] as string[];
                            if (arr.length === 0) return null;
                            return (
                              <div key={key} className="rounded-lg border border-primary/10 bg-primary/[0.03] p-4 transition-colors hover:border-primary/20 hover:bg-primary/[0.05]">
                                <h5 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary/70">
                                  {key === "strengths" && <Zap className="size-3 text-green-400" />}
                                  {key === "weaknesses" && <AlertTriangle className="size-3 text-red-400" />}
                                  {key === "opportunities" && <LineChart className="size-3 text-blue-400" />}
                                  {key === "threats" && <ShieldAlert className="size-3 text-orange-400" />}
                                  {key}
                                </h5>
                                <ul className="space-y-2">
                                  {arr.map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm leading-5 text-muted-foreground">
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
                          <Users className="size-4 text-primary" /> Target Personas
                        </h4>
                        <div className="grid gap-3 md:grid-cols-3">
                          {personas.map((persona: Record<string, unknown>, i: number) => (
                            <div key={i} className="group flex flex-col rounded-lg border border-primary/15 bg-gradient-to-b from-primary/[0.05] to-transparent p-4">
                              <p className="font-mono text-[10px] text-primary/50">PERSONA {i + 1}</p>
                              <p className="mt-1 font-semibold text-white group-hover:text-primary transition-colors">{String(persona.name)}</p>
                              <p className="mt-2 text-xs leading-5 text-muted-foreground">{String(persona.description || persona.role)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
                          <Lightbulb className="size-4 text-primary" /> Strategic Recommendations
                        </h4>
                        <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-5">
                          <ul className="space-y-3">
                            {recommendations.map((rec: unknown, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-sm leading-6 text-foreground/90">
                                <Target className="mt-1 size-4 shrink-0 text-primary" />
                                <span>{String(rec)}</span>
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
                          <Milestone className="size-4 text-primary" /> Launch Timeline
                        </h4>
                        <div className="space-y-3">
                          {launchPlan.map((phase: Record<string, unknown>, i: number) => (
                            <div key={i} className="relative overflow-hidden rounded-lg border border-primary/15 bg-primary/[0.03] p-5">
                              <div className="absolute left-0 top-0 h-full w-1 bg-primary/40" />
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                                <h5 className="font-semibold text-white">{String(phase.phase)}</h5>
                                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                  {String(phase.timeline)}
                                </span>
                              </div>
                              <ul className="grid gap-2 sm:grid-cols-2">
                                {(Array.isArray(phase.actions) ? phase.actions : []).map((action: unknown, j: number) => (
                                  <li key={j} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                                    <ArrowRight className="mt-0.5 size-3 shrink-0 text-primary/60" />
                                    {String(action)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
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
                  <p className="text-sm leading-6 text-foreground">{liveProject.strategy}</p>
                ) : Array.isArray(liveProject.strategy) ? (
                  <div className="space-y-2">
                    {(liveProject.strategy as unknown[]).map((item, i) => (
                      <div key={i} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3 text-sm text-foreground">
                        {typeof item === "string" ? item : JSON.stringify(item, null, 2)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(liveProject.strategy as Record<string, unknown>).map(([key, val]) => (
                      <div key={key} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3">
                        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">{key}</p>
                        <p className="text-sm leading-6 text-foreground">
                          {typeof val === "string" ? val : JSON.stringify(val, null, 2)}
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

      {/* campaigns */}
      <WorkflowSection
        title="Campaign Concepts"
        description="Social campaigns across platforms"
        status={sectionStatus(hasCampaigns, submitting, undefined)}
        emptyTitle="No Campaigns Yet"
        emptyDescription="Campaigns are generated as part of the strategy pipeline."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {liveProject?.campaigns.map((campaign, i) => {
            const c = campaign as Record<string, unknown>;
            const title = c.title ?? c.name ?? `Campaign ${i + 1}`;
            const objective = c.objective ?? c.description ?? c.hook ?? "";
            const platform = c.platform ?? "";
            const tone = c.tone ?? "";
            return (
              <div key={i} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
                <Rocket className="mb-2 size-4 text-primary" />
                <p className="text-sm font-semibold text-white">{String(title)}</p>
                {platform ? <p className="mt-0.5 text-[10px] font-mono text-primary/70">{String(platform)}</p> : null}
                <p className="mt-1 text-xs leading-5 text-muted">{String(objective)}</p>
                {tone ? <p className="mt-1 text-[10px] text-muted/60 italic">{String(tone)}</p> : null}
              </div>
            );
          })}
        </div>
      </WorkflowSection>

      {/* storyboards */}
      <WorkflowSection
        title="Storyboards"
        description="Cinematic scene breakdowns for each campaign"
        status={sectionStatus(hasStoryboards, submitting, undefined)}
        emptyTitle="No Storyboards Yet"
        emptyDescription="Storyboards are generated after campaigns are ready."
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {liveProject?.storyboards.flatMap((board, campIdx) => {
            const scenes = Array.isArray(board) ? board : [board];
            return scenes.map((scene, sceneIdx) => {
              const s = scene as Record<string, unknown>;
              const title = s.sceneTitle ?? s.title ?? `Scene ${sceneIdx + 1}`;
              const script = s.script ?? s.description ?? "";
              const imagePrompt = s.imagePrompt ?? "";
              
              return (
                <div key={`${campIdx}-${sceneIdx}`} className="rounded-lg border border-primary/15 bg-black/20 p-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                    Campaign {campIdx + 1} · Scene {sceneIdx + 1}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white/90">{String(title)}</p>
                  
                  {imagePrompt ? (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Image Prompt</p>
                        <Link 
                          href={`/images?prompt=${encodeURIComponent(String(imagePrompt))}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          <ImageIcon className="size-3" />
                          Generate
                        </Link>
                      </div>
                      <p className="text-xs leading-5 text-muted">{String(imagePrompt)}</p>
                    </div>
                  ) : null}
                  
                  {script ? (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Script</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{String(script)}</p>
                    </div>
                  ) : null}

                  {(!imagePrompt && !script) && (
                    <p className="mt-2 text-xs leading-5 text-muted">{String(s.imagePrompt ?? s.script ?? s.description ?? "")}</p>
                  )}
                </div>
              );
            });
          })}
        </div>
      </WorkflowSection>
    </div>
  );
}
