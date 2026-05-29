"use client";

import { ImageIcon, Palette, Save, SlidersHorizontal, Volume2 } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useUiStore } from "@/store/ui-store";

const toneOptions = ["Authoritative", "Playful", "Minimalist", "Energetic", "Technical & Precise"];
const brandColors = [
  ["Primary", "#72ff5f", "bg-primary"],
  ["Secondary", "#b8f7a9", "bg-secondary"],
  ["Accent / Glow", "#62ff9a", "bg-cyan-glow"],
] as const;

export function SettingsView() {
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);

  return (
    <PageShell
      title="Brand Identity"
      description="Configure your brand's core identity parameters. These settings dictate how Marketly AI generates copy, selects visuals, and designs campaigns for your organization."
      actions={<Button type="button"><Save className="size-4" />Save settings</Button>}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_26rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="size-5 text-primary" />Core Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="Brand name" id="brand-name">
                <Input id="brand-name" defaultValue="Acme Corp Luxury" />
              </FormField>
              <FormField label="Tagline / niche" id="tagline">
                <Input id="tagline" defaultValue="High-End FinTech" />
              </FormField>
              <FormField label="Elevator pitch" id="elevator-pitch" className="md:col-span-2">
                <Textarea id="elevator-pitch" defaultValue="We provide algorithmic wealth management tools wrapped in a bespoke, minimalist digital experience for ultra-high-net-worth individuals." />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Volume2 className="size-5 text-primary" />Voice & Tone Matrix</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {toneOptions.map((tone) => (
                <label key={tone} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="text-sm text-muted">{tone}</span>
                  <Switch defaultChecked={tone !== "Playful"} aria-label={`${tone} tone`} />
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5" aria-label="Brand settings summary">
          <Card>
            <CardHeader>
              <CardTitle>Brand Mark</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="grid size-32 place-items-center rounded-lg border border-primary/15 bg-gradient-to-br from-primary/10 to-black/30 shadow-glow" aria-hidden="true">
                <div className="size-12 rotate-45 rounded-xl border border-white/20 bg-black/30" />
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">SVG or PNG transparent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="size-5 text-primary" />Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandColors.map(([label, value, color]) => (
                <FormField key={label} label={label}>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-2">
                    <span className={`size-8 rounded-full ${color}`} aria-hidden="true" />
                    <span className="font-mono text-sm text-foreground">{value}</span>
                  </div>
                </FormField>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="size-5 text-primary" />Theme</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(["dark", "dim", "contrast"] as const).map((mode) => (
                <button key={mode} onClick={() => setThemeMode(mode)} className={`rounded-lg border px-3 py-2 text-sm capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow ${themeMode === mode ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/[0.04] text-muted"}`} type="button" aria-pressed={themeMode === mode}>
                  {mode}
                </button>
              ))}
              <Badge className="ml-auto">Autosaved</Badge>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
