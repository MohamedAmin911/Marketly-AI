import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { normalizeApiError } from "@/server/errors/api-error";
import { logger } from "@/server/logging/logger";
import { jsonError, jsonSuccess, type ApiMeta } from "@/server/http/responses";
import { enforceRateLimit } from "@/server/security/rate-limit";

type HandlerContext<TParams = unknown> = {
  meta: ApiMeta;
  params?: TParams;
  request: NextRequest;
};

type HandlerOptions = {
  cache?: {
    maxAge?: number;
    staleWhileRevalidate?: number;
  };
  rateLimit?: {
    keyPrefix: string;
    limit: number;
    windowMs: number;
  };
};

type Handler<TData, TParams = unknown> = (context: HandlerContext<TParams>) => Promise<TData | NextResponse>;

export function createApiHandler<TData, TParams = unknown>(handler: Handler<TData, TParams>, options: HandlerOptions = {}) {
  return async (request: NextRequest, routeContext: { params: Promise<TParams> }) => {
    const startedAt = Date.now();
    const meta: ApiMeta = {
      requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    try {
      if (options.rateLimit) enforceRateLimit(request, options.rateLimit);

      const params = routeContext?.params ? await routeContext.params : undefined;
      const result = await handler({ meta, params, request });

      logger.info("api.request.completed", {
        durationMs: Date.now() - startedAt,
        method: request.method,
        path: request.nextUrl.pathname,
        requestId: meta.requestId,
      });

      const response = result instanceof NextResponse ? result : jsonSuccess(result, meta);
      applyCacheHeaders(response, options.cache);

      return response;
    } catch (error) {
      const apiError = normalizeApiError(error);

      logger.error("api.request.failed", {
        errorMessage: error instanceof Error ? error.message : String(error),
        code: apiError.code,
        durationMs: Date.now() - startedAt,
        method: request.method,
        path: request.nextUrl.pathname,
        requestId: meta.requestId,
        status: apiError.status,
      });

      return jsonError(apiError, meta);
    }
  };
}

function applyCacheHeaders(response: NextResponse, cache?: HandlerOptions["cache"]) {
  if (!cache) return;

  const maxAge = cache.maxAge ?? 0;
  const staleWhileRevalidate = cache.staleWhileRevalidate ?? 0;
  response.headers.set("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message = "Request timed out."): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
