import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";
import { connectToDatabase } from "@/server/database";
import { BrandModel } from "@/server/database/models/brand.model";

export const GET = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  await connectToDatabase();

  const brand = await BrandModel.findOne({ userId: auth.user.sub }).lean();
  return { brand: brand ?? null };
});

export const POST = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  await connectToDatabase();

  const body = await request.json() as Partial<{
    name: string;
    tagline: string;
    elevatorPitch: string;
    industry: string;
    targetAudience: string;
    language: string;
    aiPersonality: string;
    tones: string[];
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    socialLinks: Record<string, string>;
  }>;

  const brand = await BrandModel.findOneAndUpdate(
    { userId: auth.user.sub },
    { $set: { ...body, userId: auth.user.sub, updatedAt: new Date() } },
    { upsert: true, new: true, strict: false },
  ).lean();

  return { brand, ok: true };
});