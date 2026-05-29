const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;
const HTML_TAGS = /<[^>]*>/g;

export function sanitizeString(value: string): string {
  return value.replace(CONTROL_CHARS, "").replace(HTML_TAGS, "").trim();
}

export function sanitizePayload<T>(value: T): T {
  if (typeof value === "string") return sanitizeString(value) as T;

  if (typeof File !== "undefined" && value instanceof File) return value;
  if (typeof Blob !== "undefined" && value instanceof Blob) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizePayload(item)]),
    ) as T;
  }

  return value;
}
