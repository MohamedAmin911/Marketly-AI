import { createApiHandler } from "@/server/http/route-handler";
import { jsonSuccess } from "@/server/http/responses";
import { requireAuth, requireRole } from "@/server/security/auth-guard";
import { UserModel } from "@/server/database/models/user.model";
import { connectToDatabase } from "@/server/database";

export const GET = createApiHandler(
  async ({ meta, request }) => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select("-passwordHash -refreshTokens -passwordResetToken -passwordResetExpires -verificationToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    return jsonSuccess({
      users: users.map(u => ({ ...u, id: u._id })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }, meta);
  }
);
