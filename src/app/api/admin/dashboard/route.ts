import { createApiHandler } from "@/server/http/route-handler";
import { requireAdmin } from "@/server/http/subscription-middleware";
import { UserModel } from "@/server/database/models/user.model";
import { CreditLedgerModel } from "@/server/database/models/credit-ledger.model";
import { AssistantMessageModel } from "@/server/database/models/assistant-message.model";
import { BillingTransactionModel } from "@/server/database/models/billing-transaction.model";

export const GET = createApiHandler(async ({ request }) => {
  await requireAdmin(request);
  
  const [
    totalUsers, 
    activeUsers, 
    premiumUsers, 
    totalRevenue, 
    creditsConsumed, 
    aiRequests
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ status: "active" }),
    UserModel.countDocuments({ "subscription.plan": { $ne: "free" } }),
    BillingTransactionModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    CreditLedgerModel.aggregate([{ $match: { type: "deduction" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    AssistantMessageModel.countDocuments({ role: "user" })
  ]);

  return { 
    totalUsers,
    activeUsers,
    premiumUsers,
    freeUsers: totalUsers - premiumUsers,
    monthlyRevenue: totalRevenue[0]?.total || 0,
    creditsConsumed: Math.abs(creditsConsumed[0]?.total || 0),
    aiRequests
  };
});
