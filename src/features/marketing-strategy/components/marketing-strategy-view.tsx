"use client";

import { AlertTriangle, BarChart3, BrainCircuit, Download, Loader2, Sparkles, Target, Trophy, Users, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDefaultStrategyRequest, useMarketingStrategy } from "@/features/marketing-strategy/hooks";
import type { MarketingStrategyOutput } from "@/features/marketing-strategy/types";

const swotTone = {
  Opportunities: "warning",
  Strengths: "success",
  Threats: "danger",
  Weaknesses: "danger",
} as const;

export function MarketingStrategyView() {
  const defaultRequest = useDefaultStrategyRequest();
  const [brandName, setBrandName] = useState(defaultRequest.brand.name);
  const [industry, setIndustry] = useState(defaultRequest.brand.industry);
  const [brief, setBrief] = useState(defaultRequest.brand.offer);
  const [audience, setAudience] = useState(defaultRequest.brand.audience);
  const strategy = useMarketingStrategy();
  const data = strategy.data as MarketingStrategyOutput | undefined;
  const hasGenerated = useRef(false);

  const request = useMemo(
    () => ({
      ...defaultRequest,
      brand: {
        ...defaultRequest.brand,
        audience,
        industry,
        name: brandName,
        offer: brief,
      },
    }),
    [audience, brandName, brief, defaultRequest, industry],
  );

  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    strategy.mutate(request);
  }, [request, strategy]);

  return (
    <PageShell
      title="AI Marketing Strategy"
      description="SWOT, personas, competitors, recommendations, analytics insights, and a 30-day plan powered by Mistral 7B Instruct workflow logic."
      actions={
        <Button variant="secondary" type="button">
          <Download className="size-4" />
          Export Plan
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
        <Card className="self-start">
          <CardHeader>
            <div>
              <CardTitle>Brand Setup</CardTitle>
              <CardDescription>Analyze brand, campaigns, analytics, and memory.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Brand name" id="strategy-brand-name">
              <Input id="strategy-brand-name" value={brandName} onChange={(event) => setBrandName(event.target.value)} />
            </FormField>
            <FormField label="Industry" id="strategy-industry">
              <Input id="strategy-industry" value={industry} onChange={(event) => setIndustry(event.target.value)} />
            </FormField>
            <FormField label="Audience" id="strategy-audience">
              <Input id="strategy-audience" value={audience} onChange={(event) => setAudience(event.target.value)} />
            </FormField>
            <FormField label="Core brief" id="strategy-brief">
              <Textarea id="strategy-brief" value={brief} onChange={(event) => setBrief(event.target.value)} />
            </FormField>
            <Button className="w-full" type="button" onClick={() => strategy.mutate(request)} disabled={strategy.isPending}>
              {strategy.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Generate Strategy
            </Button>
            <div className="rounded-lg border border-primary/15 bg-primary/[0.035] p-4 text-xs leading-5 text-muted">
              <p className="font-mono uppercase tracking-[0.1em] text-primary">AI Workflow</p>
              <p className="mt-2">Analyze brand, campaigns, and analytics; inject memory; recommend; personalize.</p>
              <p className="mt-2 text-white">{data?.context.model ?? defaultRequest.model}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {strategy.error ? (
            <Card className="border-red-300/30">
              <CardContent className="flex items-center gap-3 text-red-200">
                <AlertTriangle className="size-5" />
                Strategy generation failed. Check the analytics fields and try again.
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Strategy Summary</CardTitle>
                <CardDescription>{data?.summary ?? "Generating the first intelligence pass..."}</CardDescription>
              </div>
              <Badge>{strategy.isPending ? "Running" : "Ready"}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Signal icon={BarChart3} label="Analytics Contract" value="impressions, clicks, conversions, CTR, ROI" />
              <Signal icon={BrainCircuit} label="AI Memory" value={`${defaultRequest.memory.successfulPrompts.length} prompt pattern stored`} />
              <Signal icon={Trophy} label="Guardrails" value="evidence checks, conflict detection, deduping" />
            </CardContent>
          </Card>

          <section className="grid gap-5 lg:grid-cols-2">
            {data?.swot.map((card) => (
              <Card key={card.title}>
                <CardHeader>
                  <Badge tone={swotTone[card.title as keyof typeof swotTone] ?? "default"}>{card.title}</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm leading-6 text-muted">
                    {card.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_22rem]">
            <Card>
              <CardHeader>
                <CardTitle>Target Personas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {data?.personas.map((persona) => (
                  <div key={persona.name} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
                    <Target className="mb-3 size-5 text-primary" />
                    <h3 className="font-display text-lg font-semibold text-white">{persona.name}</h3>
                    <p className="text-sm text-muted">{persona.role}</p>
                    <p className="mt-3 text-sm leading-6 text-foreground">{persona.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {persona.channels.map((channel) => (
                        <Badge key={channel}>{channel}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.memorySignals.length ? data.memorySignals : ["Preference memory will appear after generation."]).map((signal) => (
                  <p key={signal} className="rounded-lg border border-primary/15 bg-black/20 p-3 text-sm leading-6 text-muted">
                    {signal}
                  </p>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            {data?.competitors.map((competitor) => (
              <Card key={competitor.name}>
                <CardHeader>
                  <div>
                    <CardTitle className="text-lg">{competitor.name}</CardTitle>
                    <CardDescription>{competitor.position}</CardDescription>
                  </div>
                  <Badge tone={competitor.threatLevel === "high" ? "danger" : "warning"}>{competitor.threatLevel}</Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted">
                  <p>{competitor.gap}</p>
                  <p className="text-foreground">{competitor.advantage}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.analyticsInsights.slice(0, 4).map((insight) => (
                  <InsightRow key={`${insight.title}-${insight.evidence}`} insight={insight} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Engine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.recommendations.slice(0, 4).map((recommendation) => (
                  <div key={recommendation.title} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-white">{recommendation.title}</h3>
                      <Badge tone={recommendation.priority === "high" ? "danger" : "warning"}>{Math.round(recommendation.confidence * 100)}%</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{recommendation.action}</p>
                    <p className="mt-3 font-mono text-[11px] leading-5 text-primary">{recommendation.evidence}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>30-Day Launch Plan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data?.plan.map((step) => (
                <div key={step.days} className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
                  <Badge>{step.days}</Badge>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{step.focus}</h3>
                  <p className="mt-2 text-xs leading-5 text-primary">{step.kpi}</p>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                    {step.tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Signal({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/15 bg-primary/[0.04] p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function InsightRow({ insight }: { insight: NonNullable<MarketingStrategyOutput["analyticsInsights"]>[number] }) {
  return (
    <div className="rounded-lg border border-primary/15 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <h3 className="font-semibold text-white">{insight.title}</h3>
        </div>
        <Badge tone={insight.severity === "high" ? "danger" : insight.severity === "medium" ? "warning" : "success"}>{insight.type}</Badge>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{insight.description}</p>
      <p className="mt-3 font-mono text-[11px] leading-5 text-primary">{insight.evidence}</p>
    </div>
  );
}
