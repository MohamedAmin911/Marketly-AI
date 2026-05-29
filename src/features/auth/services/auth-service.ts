import type { ForgotPasswordFormValues, LoginFormValues, ResetPasswordFormValues, SignupFormValues } from "@/features/auth/utils/schema";
import { apiJson } from "@/lib/api/client";

type AuthUser = {
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  role: string;
  tenantId: string;
};

export async function login(values: LoginFormValues) {
  return postAuth<{ user: AuthUser }>("/api/auth/login", values);
}

export async function signup(values: SignupFormValues) {
  return postAuth<{ user: AuthUser }>("/api/auth/signup", values);
}

export async function requestPasswordReset(values: ForgotPasswordFormValues) {
  return postAuth<{ accepted: true; resetToken?: string | null }>("/api/auth/forgot-password", values);
}

export async function resetPassword(values: ResetPasswordFormValues) {
  return postAuth<{ reset: true }>("/api/auth/reset-password", values);
}

async function postAuth<TData>(url: string, body: unknown): Promise<TData> {
  return apiJson<TData>(url, {
    body,
    method: "POST",
    timeoutMs: 15_000,
  });
}
