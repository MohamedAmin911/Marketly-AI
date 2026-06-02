import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const iterations = 310_000;
const keyLength = 32;
const digest = "sha256";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("base64url");

  return `pbkdf2_${digest}$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;

  const [algorithm, iterationText, salt, expected] = storedHash.split("$");
  if (algorithm !== `pbkdf2_${digest}` || !iterationText || !salt || !expected) return false;

  const parsedIterations = Number(iterationText);
  if (!Number.isSafeInteger(parsedIterations) || parsedIterations <= 0) return false;

  const actualBuffer = Buffer.from(pbkdf2Sync(password, salt, parsedIterations, keyLength, digest).toString("base64url"));
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(actualBuffer, expectedBuffer);
}
