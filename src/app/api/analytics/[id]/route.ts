import { NextResponse } from "next/server";
import { createApiHandler } from "@/server/http/route-handler";
import { requireAuth } from "@/server/security/auth-guard";
import { connectToDatabase } from "@/server/database/connection";
import { AnalyticsEngineModel } from "@/server/database/models/analytics-engine.model";
import { Types } from "mongoose";

export const GET = createApiHandler<any, { id: string }>(async ({ request, params }) => {
  const auth = await requireAuth(request);
  const id = params?.id;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ success: false, message: "Invalid ID parameter" }, { status: 400 });
  }

  await connectToDatabase();

  const generation = await AnalyticsEngineModel.findOne({
    _id: id,
    userId: new Types.ObjectId(auth.user.sub),
    deletedAt: null,
  }).lean();

  if (!generation) {
    return NextResponse.json({ success: false, message: "Analytics generation not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    generation,
  });
});
