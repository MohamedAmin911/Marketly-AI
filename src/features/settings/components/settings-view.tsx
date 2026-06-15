"use client";

import { Globe, ImageIcon, Loader2, Palette, Save, SlidersHorizontal, Users, Volume2 } from "lucide-react";
import { useRef, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_BRAND, useBrand, type BrandData } from "@/features/settings/hooks";
import { useUiStore } from "@/store/ui-store";

const TONE_OPTIONS = ["Authoritative", "Playful", "Minimalist", "Energetic", "Technical & Precise"];
const INDUSTRY_OPTIONS = ["Marketing & Advertising", "B2B SaaS", "E-Commerce", "FinTech", "Healthcare", "Real Estate", "Education", "Other"];
const PERSONALITY_OPTIONS = [
  { value: "formal", label: "Formal", desc: "Professional and structured" },
  { value: "casual", label: "Casual", desc: "Friendly and conversational" },
  { value: "technical", label: "Technical", desc: "Data-driven and precise" },
] as const;

export function SettingsView() {
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);
  const { brand: savedBrand, isLoading, isSaving, saved, save } = useBrand();

  const [local, setLocal] = useState<BrandData | null>(null);
  const brand = local ?? savedBrand;
  const logoInputRef = useRef<HTMLInputElement>(null);

  function update(field: keyof BrandData, value: unknown) {
    setLocal((prev) => ({ ...(prev ?? savedBrand), [field]: value }));
  }

  function updateSocial(field: keyof BrandData["socialLinks"], value: string) {
    setLocal((prev) => ({ ...(prev ?? savedBrand), socialLinks: { ...(prev ?? savedBrand).socialLinks, [field]: value } }));
  }

  function toggleTone(tone: string) {
    const current = brand.tones;
    update("tones", current.includes(tone) ? current.filter((t) => t !== tone) : [...current, tone]);
  }

  function handleLogoUpload(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("logoUrl", reader.result as string);
    reader.readAsDataURL(file);
  }

  if (isLoading) {
    return (
      <PageShell title="Brand Identity" description="Configure your brand's core identity parameters.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Brand Identity"
      description="Configure your brand's core identity parameters. These settings dictate how Marketly AI generates copy, selects visuals, and designs campaigns for your organization."
      actions={
        <Button type="button" onClick={() => save(brand)} disabled={isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved!" : "Save settings"}
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_26rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="size-5 text-primary" />Core Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField label="Brand name" id="brand-name">
                <Input id="brand-name" value={brand.name} onChange={(e) => update("name", e.target.value)} placeholder="Acme Corp" />
              </FormField>
              <FormField label="Tagline / niche" id="tagline">
                <Input id="tagline" value={brand.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="High-End FinTech" />
              </FormField>
              <FormField label="Industry" id="industry" className="md:col-span-2">
                <select
                  id="industry"
                  value={brand.industry}
                  onChange={(e) => update("industry", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#0d1117]">Select industry…</option>
                  {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#0d1117]">{o}</option>)}
                </select>
              </FormField>
              <FormField label="Elevator pitch" id="elevator-pitch" className="md:col-span-2">
                <Textarea id="elevator-pitch" value={brand.elevatorPitch} onChange={(e) => update("elevatorPitch", e.target.value)} placeholder="We provide…" />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="size-5 text-primary" />Target Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField label="Describe your ideal customer" id="target-audience">
                <Textarea id="target-audience" value={brand.targetAudience} onChange={(e) => update("targetAudience", e.target.value)} placeholder="Operations and growth leaders…" className="min-h-[80px]" />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Volume2 className="size-5 text-primary" />Voice & Tone Matrix</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {TONE_OPTIONS.map((tone) => (
                <label key={tone} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 cursor-pointer">
                  <span className="text-sm text-muted">{tone}</span>
                  <Switch checked={brand.tones.includes(tone)} onCheckedChange={() => toggleTone(tone)} aria-label={`${tone} tone`} />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="size-5 text-primary" />AI Personality</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {PERSONALITY_OPTIONS.map((p) => (
                <button key={p.value} type="button" onClick={() => update("aiPersonality", p.value)}
                  className={`rounded-xl border p-3 text-left transition ${brand.aiPersonality === p.value ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.04]"}`}>
                  <p className="text-sm font-medium text-foreground">{p.label}</p>
                  <p className="mt-1 text-xs text-muted">{p.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="size-5 text-primary" />Social & Web</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {(["website", "linkedin", "twitter", "instagram"] as const).map((key) => (
                <FormField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} id={key}>
                  <Input id={key} value={brand.socialLinks[key]} onChange={(e) => updateSocial(key, e.target.value)} placeholder={`https://${key}.com/…`} />
                </FormField>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Brand Mark</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {brand.logoUrl ? (
                <div className="size-32 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer"
                  style={{ backgroundColor: brand.primaryColor + "22" }}
                  onClick={() => logoInputRef.current?.click()}>
                  <img src={brand.logoUrl} alt="Brand logo" className="size-full object-contain"
                    style={{ filter: `drop-shadow(0 0 8px ${brand.primaryColor}88)` }} />
                </div>
              ) : (
                <div className="grid size-32 place-items-center rounded-lg border cursor-pointer transition-colors"
                  style={{ borderColor: brand.primaryColor + "44", background: `linear-gradient(135deg, ${brand.primaryColor}18, #00000050)` }}
                  onClick={() => logoInputRef.current?.click()}>
                  <div className="size-12 rotate-45 rounded-xl border border-white/20 bg-black/30" />
                </div>
              )}
              <Button variant="secondary" size="sm" type="button" onClick={() => logoInputRef.current?.click()}>
                {brand.logoUrl ? "Change logo" : "Upload logo"}
              </Button>
              <input ref={logoInputRef} type="file" className="hidden" accept="image/*,.svg,image/svg+xml" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted">SVG or PNG transparent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="size-5 text-primary" />Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {([["Primary", "primaryColor"], ["Secondary", "secondaryColor"], ["Accent / Glow", "accentColor"]] as const).map(([label, field]) => (
                <FormField key={field} label={label}>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-2">
                    <input type="color" value={brand[field]} onChange={(e) => update(field, e.target.value)}
                      className="size-8 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                    <span className="font-mono text-sm text-foreground">{brand[field]}</span>
                  </div>
                </FormField>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Language</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              {(["en", "ar"] as const).map((lang) => (
                <button key={lang} type="button" onClick={() => update("language", lang)}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${brand.language === lang ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/[0.04] text-muted"}`}>
                  {lang === "en" ? "🇬🇧 English" : "🇦🇪 Arabic"}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="size-5 text-primary" />Theme</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(["dark", "dim", "contrast"] as const).map((mode) => (
                <button key={mode} onClick={() => setThemeMode(mode)} type="button" aria-pressed={themeMode === mode}
                  className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${themeMode === mode ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/[0.04] text-muted"}`}>
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