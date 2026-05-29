type ApiSuccess<T> = {
  data: T;
  ok: true;
};

type ApiFailure = {
  error?: {
    message?: string;
  };
  ok: false;
};

type JsonRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

const defaultTimeoutMs = 30_000;

export async function apiJson<TData>(url: string, options: JsonRequestOptions = {}): Promise<TData> {
  const { body, headers, timeoutMs = defaultTimeoutMs, ...init } = options;
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  init.signal?.addEventListener("abort", forwardAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
      headers: body instanceof FormData ? headers : { "Content-Type": "application/json", ...headers },
      signal: controller.signal,
    });
    const payload = (await response.json()) as ApiSuccess<TData> | ApiFailure;

    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "Request failed." : payload.error?.message ?? "Request failed.");
    }

    return payload.data;
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", forwardAbort);
  }
}

export async function apiBlob(url: string, options: JsonRequestOptions = {}): Promise<{ blob: Blob; filename?: string }> {
  const { body, headers, timeoutMs = defaultTimeoutMs, ...init } = options;
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  init.signal?.addEventListener("abort", forwardAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
      headers: body instanceof FormData || body === undefined ? headers : { "Content-Type": "application/json", ...headers },
      signal: controller.signal,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as ApiFailure | null;
      throw new Error(payload?.error?.message ?? "Download failed.");
    }

    const disposition = response.headers.get("content-disposition");
    const filename = disposition?.match(/filename="([^"]+)"/)?.[1];

    return { blob: await response.blob(), filename };
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", forwardAbort);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
