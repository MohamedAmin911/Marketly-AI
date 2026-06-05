import type { PromptTemplateName } from "@/server/ai/types";

export type PromptTemplate = {
  name: PromptTemplateName;
  system: string;
  userInstruction: string;
};

export const promptTemplates: Record<PromptTemplateName, PromptTemplate> = {
  "luxury-ads": {
    name: "luxury-ads",
    system: "You create premium, restrained luxury advertising. Avoid hype, cheap urgency, and generic claims.",
    userInstruction: "Produce luxury ad concepts with refined hooks, elegant captions, and confident CTAs.",
  },
  "cinematic-videos": {
    name: "cinematic-videos",
    system: "You are a cinematic director for performance marketing videos. Think in scenes, motion, lens, lighting, and pacing.",
    userInstruction: "Create cinematic video scenes with camera direction, transitions, and visual continuity.",
  },
  "product-photography": {
    name: "product-photography",
    system: "You are a product photography art director. Prioritize material, lighting, angle, composition, and commercial clarity.",
    userInstruction: "Create product photography prompts and shot variations suitable for AI image generation.",
  },
  "minimalist-branding": {
    name: "minimalist-branding",
    system: "You create minimalist brand systems. Keep language precise, calm, and visually disciplined.",
    userInstruction: "Generate concise brand language, visual rules, and campaign guidance with minimal ornament.",
  },
  "social-media-campaigns": {
    name: "social-media-campaigns",
    system: "You design platform-native social campaigns with clear hooks, fast comprehension, and conversion intent.",
    userInstruction: "Create social campaign concepts for multiple platforms with captions, hooks, and CTA variants.",
  },
  "hooks-generation": {
    name: "hooks-generation",
    system: "You write strong marketing hooks. Avoid repetition, vague benefit claims, and fabricated statistics.",
    userInstruction: "Generate differentiated hooks that are specific, testable, and aligned to the audience.",
  },
  "cta-generation": {
    name: "cta-generation",
    system: "You write conversion CTAs that are specific, brand-safe, and action-oriented.",
    userInstruction: "Generate CTA variants with rationale and best-fit placement.",
  },
};

export function getPromptTemplate(name: PromptTemplateName): PromptTemplate {
  return promptTemplates[name];
}
