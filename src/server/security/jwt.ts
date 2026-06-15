import { env } from "@/server/config/env";
import type { UserRole } from "@/server/database/enums";
import { apiErrors } from "@/server/errors/api-error";

export type TokenKind = "access" | "refresh";

export type JwtPayload = {
  exp: number;
  iat: number;
  kind: TokenKind;
  jti: string;
  role: UserRole;
  sub: string;
  tenantId: string;
};

function base64UrlEncode(input: string | Uint8Array): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : Buffer.from(input);
  return buffer.toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

async function signHmac(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return base64UrlEncode(new Uint8Array(signature));
}

function getSecret(kind: TokenKind): string {
  return kind === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
}

export async function createJwt(payload: Omit<JwtPayload, "exp" | "iat" | "jti" | "kind">, kind: TokenKind, ttlSeconds: number): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const tokenPayload: JwtPayload = {
    ...payload,
    exp: iat + ttlSeconds,
    iat,
    jti: crypto.randomUUID(),
    kind,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(tokenPayload));
  const unsigned = `${header}.${body}`;
  const signature = await signHmac(unsigned, getSecret(kind));

  return `${unsigned}.${signature}`;
}

export async function verifyJwt(token: string, kind: TokenKind): Promise<JwtPayload> {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) throw apiErrors.unauthorized("Invalid token.");

  let parsedHeader: { alg?: string; typ?: string };
  let payload: JwtPayload;

  try {
    parsedHeader = JSON.parse(base64UrlDecode(header)) as { alg?: string; typ?: string };
    payload = JSON.parse(base64UrlDecode(body)) as JwtPayload;
  } catch {
    throw apiErrors.unauthorized("Invalid token payload.");
  }

  if (parsedHeader.alg !== "HS256" || parsedHeader.typ !== "JWT") throw apiErrors.unauthorized("Invalid token header.");

  const expectedSignature = await signHmac(`${header}.${body}`, getSecret(kind));

  if (signature !== expectedSignature) throw apiErrors.unauthorized("Invalid token signature.");

  const now = Math.floor(Date.now() / 1000);

  if (payload.kind !== kind) throw apiErrors.unauthorized("Invalid token type.");
  if (!payload.sub || !payload.tenantId || !payload.jti || !payload.role) throw apiErrors.unauthorized("Invalid token claims.");

  return payload;
}
