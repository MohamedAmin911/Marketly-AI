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

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.code = code;
    this.details = options.details;
    this.expose = options.expose ?? options.status < 500;
    this.status = options.status;
  }
}

export const apiErrors = {
  badRequest: (message = "Invalid request.", details?: unknown) =>
    new ApiError("BAD_REQUEST", message, { details, status: 400 }),
  unauthorized: (message = "Authentication is required.") =>
    new ApiError("UNAUTHORIZED", message, { status: 401 }),
  forbidden: (message = "You do not have access to this resource.", details?: unknown) =>
    new ApiError("FORBIDDEN", message, { details, status: 403 }),
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
