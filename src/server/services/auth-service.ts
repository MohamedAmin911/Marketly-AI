import { apiErrors } from "@/server/errors/api-error";
import { connectToDatabase, UserModel, type IUser, type RefreshTokenSession } from "@/server/database";
import type { UserRole } from "@/server/database/enums";
import { hashPassword, verifyPassword } from "@/server/security/password";
import { clearBruteForceLimit, enforceBruteForceLimit } from "@/server/security/rate-limit";
import { createJwt, verifyJwt } from "@/server/security/jwt";
import { createOpaqueToken, hashToken } from "@/server/security/tokens";
import type { ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, SignupRequest } from "@/server/schemas/auth";
import crypto from "crypto";
import { sendVerificationEmail } from "@/server/services/mail-service";

const maxFailedLoginAttempts = 5;
const lockoutMs = 15 * 60 * 1000;
const accessTtlSeconds = 60 * 60 * 24 * 365;
const refreshTtlSeconds = 60 * 60 * 24 * 30;
const resetTtlMs = 60 * 60 * 1000;

type AuthRequestContext = {
  clientIp: string;
  userAgent?: string;
};

type AuthUser = {
  accountLockedUntil?: Date | null;
  authProvider: "credentials" | "google" | "github";
  email: string;
  emailVerified: boolean;
  failedLoginAttempts: number;
  fullName: string;
  id: string;
  lastActiveAt?: Date;
  passwordHash?: string;
  passwordResetExpires?: Date;
  passwordResetToken?: string;
  refreshTokens: RefreshTokenSession[];
  role: UserRole;
  status: "active" | "invited" | "suspended" | "deleted";
  tenantId: string;
  username: string;
  verificationToken?: string;
};

export type OAuthProvider = "github" | "google";

export type OAuthProfile = {
  avatarUrl?: string;
  email: string;
  emailVerified: boolean;
  name: string;
  provider: OAuthProvider;
  providerAccountId: string;
};

const globalForAuth = globalThis as typeof globalThis & {
  marketlyAuthUsers?: Map<string, AuthUser>;
};

const memoryUsers = globalForAuth.marketlyAuthUsers ?? new Map<string, AuthUser>();
globalForAuth.marketlyAuthUsers = memoryUsers;

export async function verifyEmail(token: string) {
  const user = await findUserByVerificationToken(token);
  if (!user) throw apiErrors.badRequest("Invalid or expired verification token.");

  user.emailVerified = true;
  user.verificationToken = undefined;
  await persistUser(user);

  return true;
}

export async function signup(input: SignupRequest, context: AuthRequestContext) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw apiErrors.conflict("An account with this email already exists.");

  const user = await createUser(input);

  return {
    user: toPublicUser(user),
  };
}

export async function login(input: LoginRequest, context: AuthRequestContext) {
  const bruteForceKey = `${context.clientIp}:${input.email}`;
  enforceBruteForceLimit(bruteForceKey);

  const user = await findUserByEmail(input.email, true);

  if (!user || user.authProvider !== "credentials" || !verifyPassword(input.password, user.passwordHash)) {
    if (user) await recordFailedLogin(user);
    throw apiErrors.unauthorized("Invalid email or password.");
  }

  // if (!user.emailVerified) {
  //   throw apiErrors.unauthorized("Please verify your email address to log in.");
  // }

  assertCanLogin(user);
  clearBruteForceLimit(bruteForceKey);
  await recordSuccessfulLogin(user);

  const tokens = await issueTokens(user, context, input.remember);

  return {
    tokens,
    user: toPublicUser(user),
  };
}

export async function loginWithOAuth(profile: OAuthProfile, context: AuthRequestContext) {
  const existing = await findUserByEmail(profile.email, true);
  const user = existing ?? await createOAuthUser(profile);

  if (existing) {
    existing.emailVerified = existing.emailVerified || profile.emailVerified;
    existing.fullName = existing.fullName || profile.name;
    await persistUser(existing);
  }

  assertCanLogin(user);
  await recordSuccessfulLogin(user);

  const tokens = await issueTokens(user, context, true);

  return {
    tokens,
    user: toPublicUser(user),
  };
}

export async function refresh(refreshToken: string, context: AuthRequestContext) {
  const payload = await verifyJwt(refreshToken, "refresh");
  const user = await findUserById(payload.sub, true);

  if (!user) throw apiErrors.unauthorized("User no longer exists.");
  assertCanLogin(user);

  const tokenHash = hashToken(refreshToken);
  const session = user.refreshTokens.find((item) => item.jti === payload.jti);

  if (!session) throw apiErrors.unauthorized("Refresh session has expired.");
  if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) throw apiErrors.unauthorized("Refresh session has expired.");
  if (session.tokenHash !== tokenHash) {
    await revokeAllRefreshTokens(user);
    throw apiErrors.unauthorized("Refresh token mismatch.");
  }

  return issueTokens(user, context, true, session);
}

export async function revokeRefreshToken(refreshToken?: string) {
  if (!refreshToken) return;

  try {
    const payload = await verifyJwt(refreshToken, "refresh");
    const user = await findUserById(payload.sub, true);
    if (!user) return;

    const session = user.refreshTokens.find((item) => item.jti === payload.jti);
    if (session) {
      session.revokedAt = new Date();
      await persistUser(user);
    }
  } catch {
    // Logout remains idempotent for expired or malformed tokens.
  }
}

export async function requestPasswordReset(input: ForgotPasswordRequest) {
  const user = await findUserByEmail(input.email, true);
  const genericResponse = { accepted: true, resetToken: process.env.NODE_ENV === "production" ? undefined : null };

  if (!user || user.authProvider !== "credentials") return genericResponse;

  const resetToken = createOpaqueToken();
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + resetTtlMs);
  await persistUser(user);

  return {
    accepted: true,
    resetToken: process.env.NODE_ENV === "production" ? undefined : resetToken,
  };
}

export async function resetPassword(input: ResetPasswordRequest) {
  const user = await findUserByResetToken(input.token);

  if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() <= Date.now()) {
    throw apiErrors.unauthorized("Password reset token is invalid or expired.");
  }

  user.passwordHash = hashPassword(input.password);
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = null;
  user.refreshTokens = [];
  await persistUser(user);

  return { reset: true };
}

export async function getPublicUser(userId: string) {
  const user = await findUserById(userId);

  if (!user) throw apiErrors.notFound("User was not found.");

  return toPublicUser(user);
}

async function issueTokens(user: AuthUser, context: AuthRequestContext, remember = true, rotatedSession?: RefreshTokenSession) {
  const basePayload = {
    role: user.role,
    sub: user.id,
    tenantId: user.tenantId,
  };

  const accessToken = await createJwt(basePayload, "access", accessTtlSeconds);
  const refreshToken = await createJwt(basePayload, "refresh", remember ? refreshTtlSeconds : 60 * 60 * 8);
  const refreshPayload = await verifyJwt(refreshToken, "refresh");
  const tokenHash = hashToken(refreshToken);

  if (rotatedSession) {
    rotatedSession.revokedAt = new Date();
    rotatedSession.replacedByTokenHash = tokenHash;
  }

  user.refreshTokens = [
    ...user.refreshTokens.filter((session) => session.expiresAt.getTime() > Date.now() && !session.revokedAt).slice(-4),
    {
      createdAt: new Date(),
      expiresAt: new Date(refreshPayload.exp * 1000),
      ipAddress: context.clientIp,
      jti: refreshPayload.jti,
      tokenHash,
      userAgent: context.userAgent,
    },
  ];
  await persistUser(user);

  return { accessToken, refreshToken };
}

async function createUser(input: SignupRequest): Promise<AuthUser> {
  const username = createUsername(input.email);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user: AuthUser = {
    accountLockedUntil: null,
    authProvider: "credentials",
    email: input.email,
    emailVerified: false,
    failedLoginAttempts: 0,
    fullName: input.name,
    id: crypto.randomUUID(),
    passwordHash: hashPassword(input.password),
    refreshTokens: [],
    role: "owner",
    status: "active",
    tenantId: crypto.randomUUID(),
    username,
    verificationToken,
  };

  if (hasDatabase()) {
    await connectToDatabase();
    const created = await UserModel.create({
      authProvider: user.authProvider,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      passwordHash: user.passwordHash,
      refreshTokens: [],
      role: user.role,
      status: user.status,
      username,
      verificationToken,
    });

    user.id = created._id.toString();
    user.tenantId = created._id.toString();
  } else {
    memoryUsers.set(user.email, user);
  }

  // Send verification email
  await sendVerificationEmail(user.email, verificationToken);

  return user;
}

async function createOAuthUser(profile: OAuthProfile): Promise<AuthUser> {
  const username = createUsername(profile.email);
  const user: AuthUser = {
    accountLockedUntil: null,
    authProvider: profile.provider,
    email: profile.email.toLowerCase(),
    emailVerified: profile.emailVerified,
    failedLoginAttempts: 0,
    fullName: profile.name,
    id: crypto.randomUUID(),
    refreshTokens: [],
    role: "owner",
    status: "active",
    tenantId: crypto.randomUUID(),
    username,
  };

  if (hasDatabase()) {
    await connectToDatabase();
    const created = await UserModel.create({
      authProvider: user.authProvider,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      refreshTokens: [],
      role: user.role,
      status: user.status,
      username: `${username}${Math.floor(Math.random() * 10000)}`.slice(0, 40),
    });

    return { ...user, id: created._id.toString(), tenantId: created._id.toString(), username: created.username };
  }

  memoryUsers.set(user.email, user);
  return user;
}

async function findUserByEmail(email: string, includeSecrets = false): Promise<AuthUser | null> {
  await ensureDemoUser();

  if (!hasDatabase()) return memoryUsers.get(email.toLowerCase()) ?? null;

  await connectToDatabase();
  const query = UserModel.findOne({ email: email.toLowerCase() });
  if (includeSecrets) query.select("+passwordHash +refreshTokens +passwordResetToken +passwordResetExpires");
  const user = await query.lean<IUser & { _id: unknown }>();

  return user ? fromDbUser(user) : null;
}

async function findUserById(id: string, includeSecrets = false): Promise<AuthUser | null> {
  await ensureDemoUser();

  if (!hasDatabase()) return [...memoryUsers.values()].find((user) => user.id === id) ?? null;

  await connectToDatabase();
  const query = UserModel.findById(id);
  if (includeSecrets) query.select("+passwordHash +refreshTokens +passwordResetToken +passwordResetExpires");
  const user = await query.lean<IUser & { _id: unknown }>();

  return user ? fromDbUser(user) : null;
}

async function findUserByResetToken(token: string): Promise<AuthUser | null> {
  await ensureDemoUser();
  const tokenHash = hashToken(token);

  if (!hasDatabase()) {
    return [...memoryUsers.values()].find((user) => user.passwordResetToken === tokenHash) ?? null;
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ passwordResetToken: tokenHash }).select("+passwordHash +refreshTokens +passwordResetToken +passwordResetExpires").lean<IUser & { _id: unknown }>();

  return user ? fromDbUser(user) : null;
}

async function findUserByVerificationToken(token: string): Promise<AuthUser | null> {
  await ensureDemoUser();

  if (!hasDatabase()) {
    return [...memoryUsers.values()].find((user) => user.verificationToken === token) ?? null;
  }

  await connectToDatabase();
  const query = UserModel.findOne({ verificationToken: token });
  const user = await query.lean<IUser & { _id: unknown }>();

  return user ? fromDbUser(user) : null;
}

async function persistUser(user: AuthUser) {
  if (!hasDatabase()) {
    memoryUsers.set(user.email, user);
    return;
  }

  await connectToDatabase();
  await UserModel.updateOne(
    { _id: user.id },
    {
      $set: {
        accountLockedUntil: user.accountLockedUntil ?? null,
        emailVerified: user.emailVerified,
        failedLoginAttempts: user.failedLoginAttempts,
        lastLogin: new Date(),
        passwordHash: user.passwordHash,
        passwordResetExpires: user.passwordResetExpires,
        passwordResetToken: user.passwordResetToken,
        refreshTokens: user.refreshTokens,
        status: user.status,
      },
    },
  );
}

async function recordFailedLogin(user: AuthUser) {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= maxFailedLoginAttempts) {
    user.accountLockedUntil = new Date(Date.now() + lockoutMs);
  }
  await persistUser(user);
}

async function recordSuccessfulLogin(user: AuthUser) {
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = null;
  await persistUser(user);
}

function assertCanLogin(user: AuthUser) {
  if (user.status === "suspended" || user.status === "deleted") throw apiErrors.forbidden("This account is not active.");
  if (user.accountLockedUntil && user.accountLockedUntil.getTime() > Date.now()) {
    throw apiErrors.rateLimited(Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 1000));
  }
}

async function revokeAllRefreshTokens(user: AuthUser) {
  const revokedAt = new Date();
  user.refreshTokens = user.refreshTokens.map((session) => ({ ...session, revokedAt }));
  await persistUser(user);
}

async function ensureDemoUser() {
  if (hasDatabase() || memoryUsers.has("demo@marketly.ai")) return;

  memoryUsers.set("demo@marketly.ai", {
    accountLockedUntil: null,
    authProvider: "credentials",
    email: "demo@marketly.ai",
    emailVerified: true,
    failedLoginAttempts: 0,
    fullName: "Demo Operator",
    id: "usr_demo",
    passwordHash: hashPassword("Password123"),
    refreshTokens: [],
    role: "owner",
    status: "active",
    tenantId: "tenant_demo",
    username: "demo",
  });
}

function fromDbUser(user: IUser & { _id: unknown }): AuthUser {
  const id = String(user._id);

  return {
    accountLockedUntil: user.accountLockedUntil,
    authProvider: user.authProvider,
    email: user.email,
    emailVerified: user.emailVerified,
    failedLoginAttempts: user.failedLoginAttempts,
    fullName: user.fullName,
    id,
    lastActiveAt: user.lastActiveAt,
    passwordHash: user.passwordHash,
    passwordResetExpires: user.passwordResetExpires,
    passwordResetToken: user.passwordResetToken,
    refreshTokens: user.refreshTokens ?? [],
    role: user.role,
    status: user.status,
    tenantId: id,
    username: user.username,
    verificationToken: user.verificationToken,
  };
}

function toPublicUser(user: AuthUser) {
  return {
    authProvider: user.authProvider,
    email: user.email,
    emailVerified: user.emailVerified,
    id: user.id,
    name: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
  };
}

function createUsername(email: string) {
  return email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32) || `user${Math.floor(Math.random() * 10000)}`;
}

function hasDatabase() {
  return Boolean(process.env.MONGODB_URI);
}
