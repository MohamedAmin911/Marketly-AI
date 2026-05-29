import type { NextRequest } from "next/server";

import { apiErrors } from "@/server/errors/api-error";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, Bucket>();

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function enforceRateLimit(request: NextRequest, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.keyPrefix}:${getClientIp(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  bucket.count += 1;

  if (bucket.count > options.limit) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    throw apiErrors.rateLimited(retryAfterSeconds);
  }
}

export function enforceBruteForceLimit(identifier: string) {
  const now = Date.now();
  const key = `brute:${identifier.toLowerCase()}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }

  bucket.count += 1;

  if (bucket.count > 5) {
    throw apiErrors.rateLimited(Math.ceil((bucket.resetAt - now) / 1000));
  }
}

export function clearBruteForceLimit(identifier: string) {
  buckets.delete(`brute:${identifier.toLowerCase()}`);
}
