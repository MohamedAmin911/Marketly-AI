import { NextResponse } from "next/server";

import type { ApiError } from "@/server/errors/api-error";
import { clearAuthCookies } from "@/server/security/cookies";
import { isForceLogoutDetails } from "@/server/moderation/with-moderation";

export type ApiMeta = {
  requestId: string;
  timestamp: string;
};

export type ApiSuccess<TData> = {
  data: TData;
  meta: ApiMeta;
  ok: true;
};

export type ApiFailure = {
  error: {
    code: string;
    details?: unknown;
    message: string;
  };
  meta: ApiMeta;
  ok: false;
};

export function jsonSuccess<TData>(data: TData, meta: ApiMeta, init?: ResponseInit): NextResponse<ApiSuccess<TData>> {
  return NextResponse.json({ data, meta, ok: true }, init);
}

export function jsonError(error: ApiError, meta: ApiMeta): NextResponse<ApiFailure> {
  const payload: ApiFailure = {
      error: {
        code: error.code,
        details: error.expose ? error.details : undefined,
        message: error.expose ? error.message : "Unexpected server error.",
      },
      meta,
      ok: false,
    };
  const response = NextResponse.json(payload, { status: error.status });

  if (isForceLogoutDetails(error.details)) {
    clearAuthCookies(response);
  }

  return response;
}
