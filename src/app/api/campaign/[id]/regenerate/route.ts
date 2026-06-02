import { createApiHandler, withTimeout } from "@/server/http/route-handler";
import { getCampaignAuth } from "@/server/campaign-generator/auth";
import { generateAndPersistCampaign } from "@/server/campaign-generator/generateCampaign";
import { socialCampaignGenerationSchema } from "@/server/campaign-generator/validators";

type CampaignParams = {
  id: string;
};

export const POST = createApiHandler<unknown, CampaignParams>(
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

    return withTimeout(generateAndPersistCampaign(body, auth.user.sub), 90_000, "Campaign regeneration timed out.");
  },
  { rateLimit: { keyPrefix: "campaign.regenerate", limit: 10, windowMs: 60 * 1000 } },
);
