import { getAIProvider } from "@/lib/services/ai-factory";
import type { CampaignAngle, CampaignCreative } from "@/server/campaign-generator/types";

export async function generateCampaignCreative(angle: CampaignAngle, productTitle: string, index: number): Promise<CampaignCreative> {
  const prompt = buildSdxlPrompt(angle, productTitle);

  try {
    const result = await getAIProvider().generateImage({
      prompt,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageResponse = await fetch(result.imageUrl);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get("content-type") ?? "image/png";

    return {
      alt: angle.title,
      campaignAngleId: angle.id,
      generationErrors: [],
      generationStatus: "completed",
      id: crypto.randomUUID(),
      mimeType: contentType,
      name: `campaign-creative-${index + 1}.png`,
      prompt,
      provider: "dall-e-3",
      size: buffer.length,
      storageKey: `campaigns/generated/${crypto.randomUUID()}.png`,
      title: angle.title,
      url: `data:${contentType};base64,${buffer.toString("base64")}`,
    };
  } catch (error) {
    console.error("OpenAI creative generation failed:", error);
    return createPreviewCreative(angle, prompt, index);
  }
}

function buildSdxlPrompt(angle: CampaignAngle, productTitle: string): string {
  return [
    "Stable Diffusion XL commercial ad creative",
    angle.prompt,
    `Product: ${productTitle}`,
    `Campaign angle: ${angle.title}`,
    `Hook mood: ${angle.hook}`,
    `${angle.platform} platform-ready composition`,
    "premium product advertising, brand-safe, realistic product, high-converting layout, clean negative space for copy",
  ].join(". ");
}

function createPreviewCreative(angle: CampaignAngle, prompt: string, index: number): CampaignCreative {
  const palette = palettes[index % palettes.length];
  const title = escapeXml(angle.title);
  const hook = escapeXml(angle.hook.slice(0, 110));
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">`,
    `<defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="55%" stop-color="${palette[1]}"/><stop offset="100%" stop-color="${palette[2]}"/></linearGradient></defs>`,
    `<rect width="1080" height="1080" fill="url(#bg)"/>`,
    `<rect x="108" y="126" width="864" height="828" rx="34" fill="rgba(0,0,0,.24)" stroke="rgba(255,255,255,.28)" stroke-width="2"/>`,
    `<circle cx="755" cy="360" r="190" fill="rgba(255,255,255,.16)"/>`,
    `<rect x="612" y="248" width="230" height="342" rx="30" fill="rgba(255,255,255,.24)" stroke="rgba(255,255,255,.46)" stroke-width="3"/>`,
    `<text x="150" y="196" fill="rgba(255,255,255,.72)" font-family="Arial, sans-serif" font-size="28" letter-spacing="5">AI CREATIVE</text>`,
    `<text x="150" y="720" fill="white" font-family="Arial, sans-serif" font-size="56" font-weight="700">${title}</text>`,
    `<text x="150" y="790" fill="rgba(255,255,255,.78)" font-family="Arial, sans-serif" font-size="30">${hook}</text>`,
    `<text x="150" y="875" fill="rgba(255,255,255,.66)" font-family="Arial, sans-serif" font-size="24">${escapeXml(angle.platform.toUpperCase())}</text>`,
    `</svg>`,
  ].join("");

  return {
    alt: angle.title,
    campaignAngleId: angle.id,
    generationErrors: [],
    generationStatus: "completed",
    id: crypto.randomUUID(),
    mimeType: "image/svg+xml",
    name: `campaign-creative-${index + 1}.svg`,
    prompt,
    provider: "openai/dall-e-3",
    size: svg.length,
    storageKey: `campaigns/previews/${crypto.randomUUID()}.svg`,
    title: angle.title,
    url: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
  };
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      '"': "&quot;",
      "&": "&amp;",
      "'": "&apos;",
      "<": "&lt;",
      ">": "&gt;",
    };
    return entities[character] ?? character;
  });
}

const palettes = [
  ["#0f766e", "#2563eb", "#c026d3"],
  ["#be123c", "#7c3aed", "#0891b2"],
  ["#134e4a", "#0f172a", "#a855f7"],
  ["#1d4ed8", "#9333ea", "#f97316"],
  ["#155e75", "#4d7c0f", "#c2410c"],
  ["#581c87", "#0369a1", "#be123c"],
];
