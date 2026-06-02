import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/server/config/env";
import { setAuthCookies } from "@/server/security/cookies";
import { getClientIp } from "@/server/security/rate-limit";
import { createOpaqueToken } from "@/server/security/tokens";
import { loginWithOAuth, type OAuthProfile, type OAuthProvider } from "@/server/services/auth-service";

type OAuthConfig = {
  authUrl: string;
  clientId?: string;
  clientSecret?: string;
  scope: string;
  tokenUrl: string;
};

const stateCookieName = "marketly_oauth_state";
const stateMaxAgeSeconds = 10 * 60;

export function startOAuth(request: NextRequest, provider: OAuthProvider) {
  const config = getOAuthConfig(provider);

  if (!config.clientId || !config.clientSecret) {
    return redirectToLogin(request, `${provider} OAuth is not configured.`);
  }

  const state = createOpaqueToken(24);
  const redirectUri = getRedirectUri(request, provider);
  const authorizeUrl = new URL(config.authUrl);

  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("state", state);
  if (provider === "google") {
    authorizeUrl.searchParams.set("access_type", "offline");
    authorizeUrl.searchParams.set("prompt", "select_account");
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(stateCookieName, `${provider}:${state}`, {
    httpOnly: true,
    maxAge: stateMaxAgeSeconds,
    path: "/api/auth/oauth",
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  });

  return response;
}

export async function completeOAuth(request: NextRequest, provider: OAuthProvider) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(stateCookieName)?.value;

  if (!code || !state || storedState !== `${provider}:${state}`) {
    return redirectToLogin(request, "OAuth sign-in could not be verified.");
  }

  try {
    const accessToken = await exchangeCodeForToken(request, provider, code);
    const profile = await fetchOAuthProfile(provider, accessToken);
    const result = await loginWithOAuth(profile, {
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    setAuthCookies(response, result.tokens);
    response.cookies.delete(stateCookieName);

    return response;
  } catch (error) {
    return redirectToLogin(request, error instanceof Error ? error.message : "OAuth sign-in failed.");
  }
}

function getOAuthConfig(provider: OAuthProvider): OAuthConfig {
  if (provider === "google") {
    return {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      scope: "openid email profile",
      tokenUrl: "https://oauth2.googleapis.com/token",
    };
  }

  return {
    authUrl: "https://github.com/login/oauth/authorize",
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    scope: "read:user user:email",
    tokenUrl: "https://github.com/login/oauth/access_token",
  };
}

async function exchangeCodeForToken(request: NextRequest, provider: OAuthProvider, code: string) {
  const config = getOAuthConfig(provider);
  const response = await fetch(config.tokenUrl, {
    body: new URLSearchParams({
      client_id: config.clientId ?? "",
      client_secret: config.clientSecret ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(request, provider),
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const payload = await response.json() as { access_token?: string; error_description?: string; error?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? `${provider} token exchange failed.`);
  }

  return payload.access_token;
}

async function fetchOAuthProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
  if (provider === "google") {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await response.json() as { email?: string; email_verified?: boolean; name?: string; picture?: string; sub?: string };

    if (!response.ok || !profile.email || !profile.sub) throw new Error("Google profile could not be loaded.");

    return {
      avatarUrl: profile.picture,
      email: profile.email,
      emailVerified: Boolean(profile.email_verified),
      name: profile.name ?? profile.email,
      provider,
      providerAccountId: profile.sub,
    };
  }

  const [userResponse, emailsResponse] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${accessToken}` },
    }),
    fetch("https://api.github.com/user/emails", {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${accessToken}` },
    }),
  ]);
  const user = await userResponse.json() as { avatar_url?: string; id?: number; login?: string; name?: string };
  const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
  const primaryEmail = Array.isArray(emails) ? emails.find((email) => email.primary) ?? emails[0] : undefined;

  if (!userResponse.ok || !emailsResponse.ok || !user.id || !primaryEmail?.email) throw new Error("GitHub profile could not be loaded.");

  return {
    avatarUrl: user.avatar_url,
    email: primaryEmail.email,
    emailVerified: primaryEmail.verified,
    name: user.name ?? user.login ?? primaryEmail.email,
    provider,
    providerAccountId: String(user.id),
  };
}

function getRedirectUri(request: NextRequest, provider: OAuthProvider) {
  return `${request.nextUrl.origin}/api/auth/oauth/${provider}/callback`;
}

function redirectToLogin(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("oauthError", message);
  return NextResponse.redirect(url);
}
