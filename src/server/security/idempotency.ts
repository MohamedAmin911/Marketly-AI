import { apiErrors } from "@/server/errors/api-error";

type IdempotencyEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const requests = new Map<string, IdempotencyEntry<unknown>>();

export function requireIdempotencyKey(headerValue: string | null): string {
  if (!headerValue) throw apiErrors.badRequest("Idempotency-Key header is required.");
  if (headerValue.length > 128) throw apiErrors.badRequest("Idempotency-Key is too long.");
  return headerValue;
}

export function runIdempotently<T>(key: string, task: () => Promise<T>, ttlMs = 5 * 60 * 1000): Promise<T> {
  const now = Date.now();
  const existing = requests.get(key) as IdempotencyEntry<T> | undefined;

  if (existing && existing.expiresAt > now) return existing.value;

  const value = task();
  requests.set(key, { expiresAt: now + ttlMs, value });

  value.catch(() => requests.delete(key));

  return value;
}
