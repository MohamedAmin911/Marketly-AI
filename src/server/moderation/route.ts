import mongoose from "mongoose";

import { connectToDatabase, UserModel } from "@/server/database";
import { apiErrors } from "@/server/errors/api-error";
import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth, requireRole } from "@/server/security/auth-guard";
import {
  AI_FEATURES,
  ModerationViolationModel,
  VIOLATION_CATEGORIES,
  VIOLATION_SEVERITIES,
  type AiFeature,
  type ViolationCategory,
  type ViolationSeverity,
} from "@/server/database/models/moderation-violation.model";

const SORT_FIELDS = new Set(["createdAt", "strikeNumber", "severity", "category", "feature", "email"]);

type ModerationAction = "ban" | "unban" | "reset_warnings";

export const GET = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  requireRole(auth, ["admin"]);
  await connectToDatabase();

  const url = new URL(request.url);
  const page = positiveInt(url.searchParams.get("page"), 1);
  const limit = Math.min(100, positiveInt(url.searchParams.get("limit"), 20));
  const sortBy = SORT_FIELDS.has(url.searchParams.get("sortBy") ?? "") ? url.searchParams.get("sortBy")! : "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") === "asc" ? 1 : -1;
  const filter = buildViolationFilter(url.searchParams);

  const [violations, total] = await Promise.all([
    ModerationViolationModel.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ModerationViolationModel.countDocuments(filter),
  ]);

  return {
    limit,
    page,
    total,
    totalPages: Math.ceil(total / limit),
    violations,
  };
});

export const POST = createApiHandler(async ({ request }) => {
  const auth = await requireAuth(request);
  requireRole(auth, ["admin"]);
  await connectToDatabase();

  const body = (await request.json().catch(() => null)) as { action?: ModerationAction; userId?: string } | null;
  const userId = body?.userId;
  const action = body?.action ?? "unban";

  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw apiErrors.badRequest("A valid userId is required.");
  }

  if (action === "ban") {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          aiModerationPermanentBan: true,
          aiModerationSuspendedUntil: null,
          status: "suspended",
        },
      },
      { new: true },
    ).select("_id aiModerationPermanentBan status");

    if (!updated) throw apiErrors.notFound("User not found.");
    return { ok: true, action, userId };
  }

  if (action === "unban") {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          aiModerationPermanentBan: false,
          aiModerationStrikes: 0,
          aiModerationSuspendedUntil: null,
          status: "active",
        },
      },
      { new: true },
    ).select("_id aiModerationPermanentBan aiModerationStrikes status");

    if (!updated) throw apiErrors.notFound("User not found.");
    return { ok: true, action, userId };
  }

  if (action === "reset_warnings") {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          aiModerationStrikes: 0,
          aiModerationSuspendedUntil: null,
        },
      },
      { new: true },
    ).select("_id aiModerationStrikes");

    if (!updated) throw apiErrors.notFound("User not found.");
    return { ok: true, action, userId };
  }

  throw apiErrors.badRequest("Unsupported moderation action.");
});

function buildViolationFilter(searchParams: URLSearchParams) {
  const filter: Record<string, unknown> = {};
  const search = searchParams.get("search")?.trim();
  const userId = searchParams.get("userId")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();
  const category = searchParams.get("category") as ViolationCategory | null;
  const feature = searchParams.get("feature") as AiFeature | null;
  const severity = searchParams.get("severity") as ViolationSeverity | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (userId) filter.userId = userId;
  if (email) filter.email = email;
  if (category && VIOLATION_CATEGORIES.includes(category)) filter.category = category;
  if (feature && AI_FEATURES.includes(feature)) filter.feature = feature;
  if (severity && VIOLATION_SEVERITIES.includes(severity)) filter.severity = severity;

  if (from || to) {
    const createdAt: Record<string, Date> = {};
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (fromDate && !Number.isNaN(fromDate.getTime())) createdAt.$gte = fromDate;
    if (toDate && !Number.isNaN(toDate.getTime())) createdAt.$lte = toDate;
    if (Object.keys(createdAt).length > 0) filter.createdAt = createdAt;
  }

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), "i");
    filter.$or = [
      { userId: pattern },
      { email: pattern },
      { prompt: pattern },
      { moderationReason: pattern },
      { matchedWords: pattern },
    ];
  }

  return filter;
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
