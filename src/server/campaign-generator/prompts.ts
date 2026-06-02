import type { SocialCampaignGenerationInput } from "@/server/campaign-generator/validators";

export function buildSocialCampaignMessages(input: Omit<SocialCampaignGenerationInput, "productImage">) {
  const customIdeas = input.customIdeas.map((idea, index) => `${index + 1}. ${idea}`).join("\n");

  return [
    {
      role: "system" as const,
      content: [
        "You are Marketly AI, a premium social media creative director for agency-grade product campaigns.",
        "Return JSON only. No markdown. No explanations. No extra keys.",
        "Required output contract: {\"posts\":[{\"title\":\"\",\"caption\":\"\",\"visualDirection\":\"\",\"platform\":\"\"}]}",
        "Return exactly 6 posts.",
      ].join("\n"),
    },
    {
      role: "user" as const,
      content: [
        "Generate 6 social media feed post concepts for the uploaded product reference.",
        "",
        "Product image context:",
        "The user uploaded the product image. Use it as the source of product identity, form, colors, materials, packaging, branding, and visual cues.",
        "",
        `Generation mode: ${input.mode === "auto" ? "Auto Scenarios" : "Custom Ideas"}`,
        `Mood preset: ${input.moodPreset}`,
        `Design theme and aesthetics: ${input.theme}`,
        "",
        input.mode === "custom"
          ? `Build the six posts around these exact custom ideas. If fewer than six are filled, extend the missing concepts in the same direction:\n${customIdeas || "No custom ideas provided."}`
          : "Invent six unique professional social media scenarios automatically.",
        "",
        "Creative quality requirements:",
        "Make every concept premium, modern, social-media-ready, platform-native, visually descriptive, and ad-agency quality.",
        "Captions should sound ready for a brand feed, not like a strategy document.",
        "Visual directions should describe composition, lighting, surface/background, styling, camera angle, and mood.",
        "Suggested platforms should be specific social channels such as Instagram, TikTok, Pinterest, LinkedIn, Facebook, or YouTube Shorts.",
      ].join("\n"),
    },
  ];
}
