import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

import { ApiError } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";
import { requireAuth } from "@/server/security/auth-guard";
import { CreditsService } from "@/server/services/billing/credits.service";
import { Types } from "mongoose";
import { isForceLogoutError, moderateAIRequest } from "@/server/moderation/with-moderation";
import { clearAuthCookies } from "@/server/security/cookies";

import { AnalyticsEngineModel, connectToDatabase } from "@/server/database";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();

    const { url, brandName, industry } = body;

    if (!url || !brandName || !industry) {
      return NextResponse.json(
        { success: false, error: "URL, brandName, and industry are required" },
        { status: 400 }
      );
    }

    await moderateAIRequest({ auth, feature: "Analytics Engine", prompts: [brandName, industry, url] });

    logger.info(`Starting analytics analysis for ${brandName} - ${url}`);

    const webhookUrl = process.env.NEXT_PUBLIC_ANALYTICS_ENGINE_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error("Analytics Webhook URL is not configured.");
    }

    // Deduct 5 credits for Analytics Analysis
    await CreditsService.deductCredits(
      auth.user.sub,
      5,
      "analytics_engine",
      "Analyzed a post using AI Analytics Engine"
    );

    // Call the N8N webhook securely from the server
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, brandName, industry }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    const data = await response.json();

    let normalizedData = data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      if (Object.keys(data).length === 0) {
        throw new Error("Analytics engine returned an empty object");
      }
      normalizedData = [data];
    }

    if (!Array.isArray(normalizedData) || normalizedData.length === 0) {
      throw new Error("Invalid response format from analytics engine");
    }

    await connectToDatabase();
    await AnalyticsEngineModel.create({
      userId: new Types.ObjectId(auth.user.sub),
      url,
      brandName,
      industry,
      response: normalizedData,
    });

    return NextResponse.json({ success: true, data: normalizedData });
  } catch (error) {
    logger.error("Analytics post analysis failed.", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    
    const status = error instanceof ApiError ? error.status : 500;

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof ApiError ? error.message : "Analysis failed",
      },
      { status }
    );
    if (isForceLogoutError(error)) clearAuthCookies(response);
    return response;
  }
}
