import type { NextResponse } from "next/server";

import { env } from "@/server/config/env";

const secure = env.NODE_ENV === "production";

export function setAuthCookies(response: NextResponse, tokens: { accessToken: string; refreshToken: string }) {
  response.cookies.set("marketly_access", tokens.accessToken, {
    httpOnly: true,
    maxAge: 60 * 15,
    path: "/",
    sameSite: "lax",
    secure,
  });
  response.cookies.set("marketly_refresh", tokens.refreshToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/api/auth",
    sameSite: "lax",
    secure,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("marketly_access");
  response.cookies.delete("marketly_refresh");
}
