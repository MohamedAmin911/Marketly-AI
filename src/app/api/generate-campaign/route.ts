import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { socialCampaignGenerationSchema } from "@/server/campaign-generator/validators";
import { generateAndPersistCampaign } from "@/server/campaign-generator/generateCampaign";
import { moderateAIRequest } from "@/server/moderation/with-moderation";

export const POST = createApiHandler(
  async ({ request }) => {
    const auth = await getCampaignAuth(request);
    const formData = await request.formData();
    const body = socialCampaignGenerationSchema.parse({
      customIdeas: String(formData.get("customIdeas") ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
      mode: formData.get("mode"),
      moodPreset: formData.get("moodPreset"),
      productImage: formData.get("productImage"),
      theme: formData.get("theme"),
    });
    await moderateAIRequest({ auth, feature: "Campaign Generator", prompts: [body.theme, body.moodPreset, ...body.customIdeas] });

    return withTimeout(generateAndPersistCampaign(body, auth.user.sub), 90_000, "Campaign generation timed out.");
  },
  { rateLimit: { keyPrefix: "campaign.generate.full", limit: 8, windowMs: 60 * 1000 } },
);
