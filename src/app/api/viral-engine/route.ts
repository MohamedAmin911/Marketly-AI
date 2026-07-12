import { NextResponse } from "next/server";
import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";
import { requireFeature } from "@/server/http/subscription-middleware";
import { connectToDatabase } from "@/server/database/connection";
import { ViralEngineModel } from "@/server/database/models/viral-engine.model";
import { CreditsService } from "@/server/services/billing/credits.service";
import { Types } from "mongoose";

export const maxDuration = 120; // Set max duration for Serverless function

export const POST = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  const payload = await request.json();
  const webhookUrl = process.env.NEXT_PUBLIC_VIRAL_ENGINE_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return NextResponse.json({ success: false, message: "Webhook URL not configured" }, { status: 500 });
  }

  // 1. Require the feature in the user's plan
  // Note: we pass NextRequest to requireFeature but we might need to wrap or just use the user directly if requireFeature needs a NextRequest.
  // Actually, wait, requireFeature takes request and feature name. 
  const user = await requireFeature(request, "viralEngine");

  // 2. Deduct credits for the generation
  await CreditsService.deductCredits(user._id.toString(), 50, "viral_engine", "Generated Viral Strategy");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`n8n responded with status ${response.status}: ${errorText}`);
    return NextResponse.json({ success: false, message: `n8n webhook error (${response.status}): The workflow is likely not active or not listening for a test event.` }, { status: response.status });
  }

  const data = await response.json();

  // Save to database
  try {
    await connectToDatabase();
    await ViralEngineModel.create({
      userId: new Types.ObjectId(auth.user.sub),
      brandName: payload.brandName || "Unknown Brand",
      industry: payload.industry || "Unknown Industry",
      targetAudience: payload.targetAudience || "Unknown Audience",
      goal: payload.goal || "Unknown Goal",
      brandBrief: payload.brandBrief || "No brief provided",
      response: data,
    });
  } catch (dbError) {
    console.error("Failed to save Viral Engine to database:", dbError);
    // Continue execution to return the data even if DB save fails
  }

  return NextResponse.json(data);
});
