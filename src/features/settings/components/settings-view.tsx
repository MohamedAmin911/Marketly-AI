"use client";

/* eslint-disable @next/next/no-img-element */

import {
  BadgeDollarSign,
  Building2,
  Check,
  Globe,
  ImageIcon,
  KeyRound,
  Loader2,
  Mail,
  Palette,
  PlugZap,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Volume2,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBrand, type BrandData } from "@/features/settings/hooks";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { BillingTab } from "@/features/billing/components/billing-tab";

const TONE_OPTIONS = ["Authoritative", "Playful", "Minimalist", "Energetic", "Technical & Precise"];
const INDUSTRY_OPTIONS = ["Marketing & Advertising", "B2B SaaS", "E-Commerce", "FinTech", "Healthcare", "Real Estate", "Education", "Other"];
const PERSONALITY_OPTIONS = [
  { value: "formal", label: "Formal", desc: "Professional and structured" },
  { value: "casual", label: "Casual", desc: "Friendly and conversational" },
  { value: "technical", label: "Technical", desc: "Data-driven and precise" },
] as const;

const tabs = [
  { value: "brand", label: "Brand Identity", icon: Building2 },
  { value: "ai", label: "AI Preferences", icon: SlidersHorizontal },
  { value: "team", label: "Team", icon: Users },
  { value: "billing", label: "Billing", icon: BadgeDollarSign },
  { value: "integrations", label: "Integrations", icon: PlugZap },
] as const;

export function SettingsView() {
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);
  const { brand: savedBrand, isLoading, isSaving, saved, save } = useBrand();
  const [local, setLocal] = useState<BrandData | null>(null);
  const brand = local ?? savedBrand;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const queryTab = searchParams.get("tab") as string;
  const initialTab = tabs.find((t) => t.value === queryTab)?.value ?? "brand";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Sync state if URL changes externally
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabs.find((t) => t.value === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  function handleTabChange(value: string) {
    setActiveTab(value);
    
    // Update URL without a full page reload, maintaining the hash if any
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}${window.location.hash}`, { scroll: false });
  }

  function update(field: keyof BrandData, value: unknown) {
    setLocal((prev) => ({ ...(prev ?? savedBrand), [field]: value }));
  }

  function updateSocial(field: keyof BrandData["socialLinks"], value: string) {
    setLocal((prev) => ({ ...(prev ?? savedBrand), socialLinks: { ...(prev ?? savedBrand).socialLinks, [field]: value } }));
  }

  function toggleTone(tone: string) {
    const current = brand.tones;
    update("tones", current.includes(tone) ? current.filter((item) => item !== tone) : [...current, tone]);
  }

  function handleLogoUpload(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLocal((prev) => ({
        ...(prev ?? savedBrand),
        logoUrl: reader.result as string,
        logoTintEnabled: false,
      }));
    };
    reader.readAsDataURL(file);
  }

  if (isLoading) {
    return (
      <PageShell title="Settings" description="Configure workspace preferences and brand defaults.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Settings"
      description="Manage brand identity, AI behavior, team workspace details, billing context, and integrations."
      actions={
        <Button type="button" onClick={() => save(brand)} disabled={isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved" : "Save settings"}
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
        <TabsList className="flex w-full flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <Icon className="size-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="brand">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="size-5 text-primary" />
                    Core Details
                  </CardTitle>
                  <CardDescription>Brand information used across campaign, ad, and strategy generation.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField label="Brand name" id="brand-name">
                    <Input id="brand-name" value={brand.name} onChange={(event) => update("name", event.target.value)} placeholder="Acme Corp" />
                  </FormField>
                  <FormField label="Tagline / niche" id="tagline">
                    <Input id="tagline" value={brand.tagline} onChange={(event) => update("tagline", event.target.value)} placeholder="High-End FinTech" />
                  </FormField>
                  <FormField label="Industry" id="industry" className="md:col-span-2">
                    <Select id="industry" value={brand.industry} onChange={(event) => update("industry", event.target.value)}>
                      <option value="">Select industry...</option>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Elevator pitch" id="elevator-pitch" className="md:col-span-2">
                    <Textarea id="elevator-pitch" value={brand.elevatorPitch} onChange={(event) => update("elevatorPitch", event.target.value)} placeholder="We provide..." />
                  </FormField>
                  <FormField label="Ideal customer" id="target-audience" className="md:col-span-2">
                    <Textarea id="target-audience" value={brand.targetAudience} onChange={(event) => update("targetAudience", event.target.value)} placeholder="Operations and growth leaders..." className="min-h-[96px]" />
                  </FormField>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="size-5 text-primary" />
                    Social & Web
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {(["website", "linkedin", "twitter", "instagram"] as const).map((key) => (
                    <FormField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} id={key}>
                      <Input id={key} value={brand.socialLinks[key]} onChange={(event) => updateSocial(key, event.target.value)} placeholder={`https://${key}.com/...`} />
                    </FormField>
                  ))}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-5">
              <BrandMarkCard brand={brand} inputRef={logoInputRef} onUpload={handleLogoUpload} />
              <BrandColorsCard brand={brand} update={update} />
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="size-5 text-primary" />
                    Voice & Tone Matrix
                  </CardTitle>
                  <CardDescription>Choose the tone traits Marketly should reflect in generated content.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {TONE_OPTIONS.map((tone) => (
                    <label key={tone} className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-surface p-4">
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{tone}</span>
                        <span className="mt-1 block text-xs text-muted">Use this voice in copy and campaign concepts.</span>
                      </span>
                      <Switch checked={brand.tones.includes(tone)} onCheckedChange={() => toggleTone(tone)} aria-label={`${tone} tone`} />
                    </label>
                  ))}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Language</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {(["en", "ar"] as const).map((lang) => (
                    <Button key={lang} type="button" variant="secondary" onClick={() => update("language", lang)} className={cn(brand.language === lang && "border-primary bg-primary/10 text-primary")}>
                      {lang === "en" ? "English" : "Arabic"}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Theme Preset</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(["dark", "dim", "contrast"] as const).map((mode) => (
                    <Button key={mode} variant="secondary" type="button" aria-pressed={themeMode === mode} onClick={() => setThemeMode(mode)} className={cn("capitalize", themeMode === mode && "border-primary bg-primary/10 text-primary")}>
                      {mode}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <PlaceholderGrid
            cards={[
              { icon: Users, title: "Workspace Members", description: "Invite collaborators and assign creative, analytics, or admin responsibilities." },
              { icon: Mail, title: "Invitations", description: "Pending invitations and role requests will be managed from this workspace." },
              { icon: ShieldCheck, title: "Access Controls", description: "Use roles to keep campaign generation, billing, and settings permissions organized." },
            ]}
          />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>

        <TabsContent value="integrations">
          <PlaceholderGrid
            cards={[
              { icon: PlugZap, title: "Slack", description: "Send generation updates and campaign summaries to your workspace." },
              { icon: KeyRound, title: "GitHub", description: "Connect creative workflows to repositories and deployment activity." },
              { icon: PlugZap, title: "Marketing Stack", description: "Prepare connections for analytics, CRM, and ad platform integrations." },
            ]}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function BrandMarkCard({
  brand,
  inputRef,
  onUpload,
}: {
  brand: BrandData;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (file: File | undefined) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Mark</CardTitle>
        <CardDescription>Upload a transparent logo for previews and brand memory.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <button
          type="button"
          className="grid size-36 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-surface transition hover:border-primary/50 hover:bg-soft-green-surface"
          onClick={() => inputRef.current?.click()}
        >
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="Brand logo" className="size-full object-contain p-4" />
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto mb-2 size-7 text-primary" />
              <span className="text-xs text-muted">Upload logo</span>
            </div>
          )}
        </button>
        <Button variant="secondary" size="sm" type="button" onClick={() => inputRef.current?.click()}>
          {brand.logoUrl ? "Change logo" : "Upload logo"}
        </Button>
        <input ref={inputRef} type="file" className="hidden" accept="image/*,.svg,image/svg+xml" onChange={(event) => onUpload(event.target.files?.[0])} />
        <p className="text-center text-xs text-muted">SVG or PNG transparent</p>
      </CardContent>
    </Card>
  );
}

function BrandColorsCard({ brand, update }: { brand: BrandData; update: (field: keyof BrandData, value: unknown) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          Brand Colors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {([["Primary", "primaryColor"], ["Secondary", "secondaryColor"], ["Accent", "accentColor"]] as const).map(([label, field]) => (
          <FormField key={field} label={label}>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
              <input type="color" value={brand[field]} onChange={(event) => update(field, event.target.value)} className="size-9 cursor-pointer rounded-md border-0 bg-transparent p-0" />
              <span className="font-mono text-sm text-foreground">{brand[field]}</span>
            </div>
          </FormField>
        ))}
      </CardContent>
    </Card>
  );
}

function PlaceholderGrid({ cards }: { cards: Array<{ description: string; icon: typeof Users; title: string }> }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader>
              <span className="mb-2 grid size-10 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge>Coming soon</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
