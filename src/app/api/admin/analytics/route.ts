import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { requireAuth, requireRole } from "@/server/security/auth-guard";
import { UserModel } from "@/server/database/models/user.model";
import { connectToDatabase } from "@/server/database";

export const GET = createApiHandler(
  async ({ meta, request }) => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);

    await connectToDatabase();

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      totalUsers,
      onlineUsers,
      activeSubscriptions,
      thirtyDaysActivity
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ lastActiveAt: { $gte: fiveMinutesAgo } }),
      UserModel.countDocuments({ "subscription.status": "active" }),
      
      // Aggregate usage over the last 30 days (approximation using usage metrics)
      // Since we don't have a dedicated generations collection easily available here without checking multiple collections,
      // we'll sum up the global usage metrics as an overall insight for the dashboard.
      UserModel.aggregate([
        {
          $group: {
            _id: null,
            totalAiRequests: { $sum: "$usage.aiRequests" },
            totalGrowthRuns: { $sum: "$usage.growthRuns" },
            totalAnalyticsRuns: { $sum: "$usage.analyticsRuns" },
            totalProjectsCreated: { $sum: "$usage.projectsCreated" },
            totalCreditsUsed: { $sum: "$usage.totalCreditsUsed" }
          }
        }
      ])
    ]);

    // Format the insights data
    const globalUsage = thirtyDaysActivity[0] || {
      totalAiRequests: 0,
      totalGrowthRuns: 0,
      totalAnalyticsRuns: 0,
      totalProjectsCreated: 0,
      totalCreditsUsed: 0
    };

    return jsonSuccess({
      kpis: {
        totalUsers,
        onlineUsers,
        activeSubscriptions,
      },
      insights: [
        { name: "AI Chat Requests", value: globalUsage.totalAiRequests },
        { name: "Growth Runs", value: globalUsage.totalGrowthRuns },
        { name: "Analytics Runs", value: globalUsage.totalAnalyticsRuns },
        { name: "Projects Created", value: globalUsage.totalProjectsCreated },
        { name: "Credits Burned", value: globalUsage.totalCreditsUsed },
      ]
    }, meta);
  }
);
