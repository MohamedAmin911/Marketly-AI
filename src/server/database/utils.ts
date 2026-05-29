import mongoose, { type ClientSession, type Model } from "mongoose";

type FilterQuery<T> = Parameters<Model<T>["find"]>[0];

export type CursorPagination = {
  cursor?: string;
  limit?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  nextCursor?: string;
};

export function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

export async function withTransaction<T>(task: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(() => task(session));
  } finally {
    await session.endSession();
  }
}

export async function paginateByCreatedAt<T extends { _id: unknown; createdAt: Date }>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: CursorPagination = {},
): Promise<PaginatedResult<T>> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const cursorDate = options.cursor ? new Date(Buffer.from(options.cursor, "base64url").toString("utf8")) : undefined;
  const query = cursorDate ? { ...filter, createdAt: { $lt: cursorDate } } : filter;
  const items = await model.find(query).sort({ createdAt: -1 }).limit(limit + 1).lean<T[]>();
  const page = items.slice(0, limit);
  const next = items.length > limit ? page.at(-1)?.createdAt : undefined;

  return {
    items: page,
    nextCursor: next ? Buffer.from(next.toISOString()).toString("base64url") : undefined,
  };
}

export async function restoreSoftDeleted<T extends { isDeleted: boolean; deletedAt?: Date | null; deletedBy?: unknown }>(
  model: Model<T>,
  filter: FilterQuery<T>,
) {
  return model.updateOne(
    { ...filter, isDeleted: true },
    { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
  );
}
