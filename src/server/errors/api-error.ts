export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

type ApiErrorOptions = {
  cause?: unknown;
  details?: unknown;
  expose?: boolean;
  status: number;
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details?: unknown;
  readonly expose: boolean;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions);
  constructor(status: number, message: string);
  constructor(codeOrStatus: ApiErrorCode | number, message: string, options?: ApiErrorOptions) {
    super(message, { cause: options?.cause });
    this.name = "ApiError";
    const normalized = typeof codeOrStatus === "number"
      ? { code: codeFromStatus(codeOrStatus), details: undefined, expose: codeOrStatus < 500, status: codeOrStatus }
      : {
          code: codeOrStatus,
          details: options?.details,
          expose: options?.expose ?? (options?.status ?? 500) < 500,
          status: options?.status ?? 500,
        };

    this.code = normalized.code;
    this.details = normalized.details;
    this.expose = normalized.expose;
    this.status = normalized.status;
  }
}

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 413) return "PAYLOAD_TOO_LARGE";
  if (status === 415) return "UNSUPPORTED_MEDIA_TYPE";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status === 504) return "TIMEOUT";
  if (status === 502) return "AI_PROVIDER_ERROR";
  if (status === 503) return "DATABASE_ERROR";
  return "INTERNAL_ERROR";
}

export const apiErrors = {
  badRequest: (message = "Invalid request.", details?: unknown) =>
    new ApiError("BAD_REQUEST", message, { details, status: 400 }),
  unauthorized: (message = "Authentication is required.") =>
    new ApiError("UNAUTHORIZED", message, { status: 401 }),
  forbidden: (message = "You do not have access to this resource.") =>
    new ApiError("FORBIDDEN", message, { status: 403 }),
  notFound: (message = "Resource was not found.") =>
    new ApiError("NOT_FOUND", message, { status: 404 }),
  conflict: (message = "Request conflicts with the current resource state.") =>
    new ApiError("CONFLICT", message, { status: 409 }),
  validation: (details: unknown) =>
    new ApiError("VALIDATION_ERROR", "Request validation failed.", { details, status: 422 }),
  rateLimited: (retryAfterSeconds: number) =>
    new ApiError("RATE_LIMITED", "Too many requests. Please retry later.", {
      details: { retryAfterSeconds },
      status: 429,
    }),
  payloadTooLarge: (message = "Payload is too large.") =>
    new ApiError("PAYLOAD_TOO_LARGE", message, { status: 413 }),
  unsupportedMediaType: (message = "Unsupported media type.") =>
    new ApiError("UNSUPPORTED_MEDIA_TYPE", message, { status: 415 }),
  timeout: (message = "Request timed out.") =>
    new ApiError("TIMEOUT", message, { status: 504 }),
  aiProvider: (message = "AI generation failed.", cause?: unknown) =>
    new ApiError("AI_PROVIDER_ERROR", message, { cause, status: 502 }),
  database: (message = "Database operation failed.", cause?: unknown) =>
    new ApiError("DATABASE_ERROR", message, { cause, status: 503 }),
  internal: (message = "Unexpected server error.", cause?: unknown) =>
    new ApiError("INTERNAL_ERROR", message, { cause, expose: false, status: 500 }),
};

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof SyntaxError) return apiErrors.badRequest("Malformed JSON body.");
  return apiErrors.internal("Unexpected server error.", error);
}
