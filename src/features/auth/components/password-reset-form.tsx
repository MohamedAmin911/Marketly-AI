"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, resetPassword } from "@/features/auth/services/auth-service";
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordFormValues, type ResetPasswordFormValues } from "@/features/auth/utils/schema";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage("");
    setResetToken(null);

    try {
      const result = await requestPasswordReset(values);
      setMessage("If an account exists, a password reset link has been prepared.");
      setResetToken(result.resetToken ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset request failed.");
    }
  });

  return (
    <div>
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-white">Reset Password</h1>
        <p className="mt-2 text-sm text-muted">Enter your email and we will prepare a secure reset flow.</p>
      </div>

      <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label="Email address" error={form.formState.errors.email?.message} id="email">
          <Input {...form.register("email")} aria-invalid={Boolean(form.formState.errors.email)} id="email" placeholder="name@company.com" type="email" autoComplete="email" />
        </FormField>

        {message ? <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-muted">{message}</p> : null}
        {resetToken ? (
          <Link className="block rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary" href={`/reset-password?token=${encodeURIComponent(resetToken)}`}>
            Continue with local dev reset token
          </Link>
        ) : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Send Reset Link
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-cyan-glow">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState("");
  const form = useForm<ResetPasswordFormValues>({
    defaultValues: { password: "", token },
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError("");

    try {
      await resetPassword({ ...values, token });
      router.push("/login");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Password reset failed.");
    }
  });

  return (
    <div>
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-white">Choose New Password</h1>
        <p className="mt-2 text-sm text-muted">Use a strong password with uppercase, lowercase, and a number.</p>
      </div>

      <form className="mt-7 space-y-4" onSubmit={onSubmit} noValidate>
        <FormField label="New password" error={form.formState.errors.password?.message} id="password">
          <Input {...form.register("password")} aria-invalid={Boolean(form.formState.errors.password)} id="password" type="password" autoComplete="new-password" />
        </FormField>

        {!token ? <p className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">Reset token is missing.</p> : null}
        {serverError ? <p className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">{serverError}</p> : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting || !token}>
          {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Reset Password
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </div>
  );
}
