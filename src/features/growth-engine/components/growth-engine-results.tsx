import { AlertTriangle, ArrowRight, ImageIcon, LineChart, Megaphone, Rocket, ShieldAlert, Target, Zap } from "lucide-react";
import Link from "next/link";

import { WorkflowSection } from "@/features/growth-engine/components/workflow-section";
import type { GrowthProjectRecord, SectionStatus } from "@/features/growth-engine/types";

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
        title="Strategy Overview"
        description="Positioning, market context, and generated strategic direction."
        status={sectionStatus(hasStrategySummary, submitting, undefined)}
        emptyTitle="No Strategy Yet"
        emptyDescription="Submit the brand brief to generate the first strategic pass."
      >
        <StrategySummary strategy={liveProject?.strategy} />
      </WorkflowSection>

      <WorkflowSection
        title="SWOT"
        description="Strengths, weaknesses, opportunities, and threats."
        status={sectionStatus(Object.keys(swot).length > 0, submitting, undefined)}
        emptyTitle="No SWOT Yet"
        emptyDescription="SWOT analysis appears after the strategy stage completes."
      >
        <SwotGrid swot={swot} />
      </WorkflowSection>

      <WorkflowSection
        title="Personas"
        description="Audience segments and buying motivations."
        status={sectionStatus(personas.length > 0, submitting, undefined)}
        emptyTitle="No Personas Yet"
        emptyDescription="Target personas are generated from your brand brief and audience inputs."
      >
        <PersonasGrid personas={personas} />
      </WorkflowSection>

      <WorkflowSection
        title="Campaign Concepts"
        description="Campaign hooks, platforms, objectives, and creative angles."
        status={sectionStatus(campaigns.length > 0, submitting, undefined)}
        emptyTitle="No Campaign Concepts Yet"
        emptyDescription="Campaign concepts are generated after the strategy stage."
      >
        <CampaignGrid campaigns={campaigns} />
      </WorkflowSection>

      <WorkflowSection
        title="Storyboards"
        description="Scene-level creative direction with image prompts."
        status={sectionStatus(storyboards.length > 0, submitting, undefined)}
        emptyTitle="No Storyboards Yet"
        emptyDescription="Storyboards are generated after campaign concepts are ready."
      >
        <StoryboardGrid storyboards={storyboards} />
      </WorkflowSection>

      <WorkflowSection
        title="Recommended Actions"
        description="Practical next steps to move from strategy to execution."
        status={sectionStatus(recommendedActions.length > 0, submitting, undefined)}
        emptyTitle="No Recommended Actions Yet"
        emptyDescription="Recommended actions appear with the generated strategy."
      >
        <RecommendedActions actions={recommendedActions} />
      </WorkflowSection>
    </div>
  );
}

function StrategySummary({ strategy }: { strategy: GrowthProjectRecord["strategy"] | undefined }) {
  if (!strategy) return null;

  if (typeof strategy === "string") {
    return <p className="text-sm leading-6 text-foreground">{strategy}</p>;
  }

  if (Array.isArray(strategy)) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {strategy.map((item, index) => (
          <div key={index} className="rounded-lg border border-border bg-surface p-4 text-sm leading-6 text-foreground">
            {typeof item === "string" ? item : JSON.stringify(item, null, 2)}
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(strategy).filter(([key]) => !["swot", "personas", "recommendations", "launchPlan"].includes(key));

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.length > 0 ? (
        entries.map(([key, value]) => (
          <div key={key} className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-primary">{formatLabel(key)}</p>
            <p className="text-sm leading-6 text-foreground">{stringifyValue(value)}</p>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">Strategy generated. Review the sections below for detailed outputs.</div>
      )}
    </div>
  );
}

function SwotGrid({ swot }: { swot: Record<string, unknown> }) {
  const items = [
    { key: "strengths", icon: Zap, title: "Strengths" },
    { key: "weaknesses", icon: AlertTriangle, title: "Weaknesses" },
    { key: "opportunities", icon: LineChart, title: "Opportunities" },
    { key: "threats", icon: ShieldAlert, title: "Threats" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(({ icon: Icon, key, title }) => {
        const values = arrayOfUnknown(swot[key]);
        if (!values.length) return null;

        return (
          <div key={key} className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon className="size-4 text-primary" />
              {title}
            </h3>
            <ul className="space-y-2">
              {values.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm leading-6 text-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {String(item)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function PersonasGrid({ personas }: { personas: Record<string, unknown>[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {personas.map((persona, index) => (
        <div key={index} className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase text-primary">Persona {index + 1}</p>
          <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{String(persona.name ?? persona.title ?? "Audience Persona")}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{String(persona.description ?? persona.role ?? persona.motivation ?? "No persona description provided.")}</p>
        </div>
      ))}
    </div>
  );
}

function CampaignGrid({ campaigns }: { campaigns: Record<string, unknown>[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {campaigns.map((campaign, index) => {
        const title = campaign.title ?? campaign.name ?? `Campaign ${index + 1}`;
        const objective = campaign.objective ?? campaign.description ?? campaign.hook ?? "";
        const platform = campaign.platform ?? "";
        const tone = campaign.tone ?? "";

        return (
          <div key={index} className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Megaphone className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{String(title)}</h3>
                {platform ? <p className="text-xs text-primary">{String(platform)}</p> : null}
              </div>
            </div>
            <p className="text-sm leading-6 text-muted">{String(objective)}</p>
            {tone ? <p className="mt-3 text-xs italic text-muted">{String(tone)}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function StoryboardGrid({ storyboards }: { storyboards: GrowthProjectRecord["storyboards"] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {storyboards.flatMap((board, campaignIndex) => {
        const scenes = Array.isArray(board) ? board : [board];

        return scenes.map((scene, sceneIndex) => {
          const title = scene.sceneTitle ?? scene.title ?? `Scene ${sceneIndex + 1}`;
          const script = scene.script ?? scene.description ?? "";
          const imagePrompt = scene.imagePrompt ?? "";

          return (
            <div key={`${campaignIndex}-${sceneIndex}`} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase text-primary">
                Campaign {campaignIndex + 1} / Scene {sceneIndex + 1}
              </p>
              <h3 className="mt-2 font-semibold text-foreground">{String(title)}</h3>

              {imagePrompt ? (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase text-muted">Image Prompt</p>
                    <Link href={`/images?prompt=${encodeURIComponent(String(imagePrompt))}`} className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15">
                      <ImageIcon className="size-3.5" />
                      Generate
                    </Link>
                  </div>
                  <p className="text-sm leading-6 text-muted">{String(imagePrompt)}</p>
                </div>
              ) : null}

              {script ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-muted">Script</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{String(script)}</p>
                </div>
              ) : null}
            </div>
          );
        });
      })}
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
          <ArrowRight className="ml-auto mt-1 size-4 shrink-0 text-muted" />
        </div>
      ))}
    </div>
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function arrayOfUnknown(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").trim();
}
