import type { SocialCampaignGenerationRequest, SocialCampaignRecord, SocialPostConcept } from "@/features/campaign-generator/types";
import { apiJson, downloadBlob } from "@/lib/api/client";

export async function generateCampaign(input: SocialCampaignGenerationRequest): Promise<SocialCampaignRecord> {
  const formData = new FormData();
  formData.set("customIdeas", input.customIdeas.join("\n"));
  formData.set("mode", input.mode);
  formData.set("moodPreset", input.moodPreset);
  formData.set("productImage", input.productFile);
  formData.set("theme", input.theme);

  return apiJson<SocialCampaignRecord>("/api/generate-campaign", {
    body: formData,
    headers: { "Idempotency-Key": crypto.randomUUID() },
    method: "POST",
    timeoutMs: 100_000,
  });
}

export async function listCampaigns(): Promise<SocialCampaignRecord[]> {
  const payload = await apiJson<{ items: SocialCampaignRecord[] }>("/api/campaigns", { method: "GET" });
  return payload.items;
}

export async function copyPost(post: SocialPostConcept) {
  await navigator.clipboard.writeText([post.title, post.caption, post.visualDirection, post.platform].join("\n\n"));
}

export function downloadCampaignCopy(campaign: SocialCampaignRecord) {
  const copy = [
    campaign.title,
    `Mode: ${campaign.mode}`,
    `Mood: ${campaign.moodPreset}`,
    `Theme: ${campaign.theme}`,
    "",
    ...campaign.posts.flatMap((post, index) => [
      `${index + 1}. ${post.title}`,
      `Caption: ${post.caption}`,
      `Visual Direction: ${post.visualDirection}`,
      `Suggested Platform: ${post.platform}`,
      "",
    ]),
  ].join("\n");

  downloadBlob(new Blob([copy], { type: "text/plain;charset=utf-8" }), "social-campaign-posts.txt");
}
