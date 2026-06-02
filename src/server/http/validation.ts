import type { NextRequest } from "next/server";
import type { z } from "zod";

import { apiErrors } from "@/server/errors/api-error";
import { sanitizePayload } from "@/server/security/sanitize";

export async function parseJsonBody<TSchema extends z.ZodType>(request: NextRequest, schema: TSchema): Promise<z.infer<TSchema>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw apiErrors.unsupportedMediaType("Expected application/json request body.");
  }

  const raw = await request.text();

  if (!raw) throw apiErrors.badRequest("Request body is required.");

  let payload: unknown;

  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw apiErrors.badRequest("Malformed JSON body.", { cause: String(error) });
  }

  return parseWithSchema(schema, sanitizePayload(payload));
}

export function parseQueryParams<TSchema extends z.ZodType>(request: NextRequest, schema: TSchema): z.infer<TSchema> {
  return parseWithSchema(schema, Object.fromEntries(request.nextUrl.searchParams.entries()));
}

export async function parseFormData<TSchema extends z.ZodType>(request: NextRequest, schema: TSchema): Promise<z.infer<TSchema>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    throw apiErrors.unsupportedMediaType("Expected multipart/form-data request body.");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    throw apiErrors.badRequest("Upload payload could not be parsed.", { cause: String(error) });
  }

  return parseWithSchema(schema, Object.fromEntries(formData.entries()));
}

export function parseWithSchema<TSchema extends z.ZodType>(schema: TSchema, payload: unknown): z.infer<TSchema> {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw apiErrors.validation(result.error.flatten());
  }

  return result.data;
}
