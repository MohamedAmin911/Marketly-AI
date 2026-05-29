"use client";

import { ArrowRight, GitBranch, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuthForm, type AuthMode } from "@/features/auth/hooks";
import type { SignupFormValues } from "@/features/auth/utils/schema";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { form, isSignup, onSubmit, serverError } = useAuthForm(mode);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const errors = form.formState.errors;

  useEffect(() => {
    setOauthError(new URLSearchParams(window.location.search).get("oauthError"));
  }, []);

  return (
    <div>
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-white">{isSignup ? "Request Access" : "Welcome Back"}</h1>
        <p className="mt-2 text-sm text-muted">{isSignup ? "Create a workspace for your AI marketing team." : "Sign in to continue to your dashboard."}</p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="secondary" type="button" asChild>
          <a href="/api/auth/oauth/google">
            <Mail className="size-4" />
            Google
          </a>
        </Button>
        <Button variant="secondary" type="button" asChild>
          <a href="/api/auth/oauth/github">
            <GitBranch className="size-4" />
            Github
          </a>
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        {isSignup ? (
          <>
            <FormField label="Name" error={"name" in errors ? errors.name?.message : undefined} id="name">
              <Input {...form.register("name" as keyof SignupFormValues)} aria-invalid={Boolean("name" in errors && errors.name)} id="name" placeholder="Nora Lee" autoComplete="name" />
            </FormField>
            <FormField label="Company" error={"company" in errors ? errors.company?.message : undefined} id="company">
              <Input {...form.register("company" as keyof SignupFormValues)} aria-invalid={Boolean("company" in errors && errors.company)} id="company" placeholder="Acme Corp Luxury" autoComplete="organization" />
            </FormField>
          </>
        ) : null}

        <FormField label="Email address" error={errors.email?.message} id="email">
          <Input {...form.register("email")} aria-invalid={Boolean(errors.email)} id="email" placeholder="name@company.com" type="email" autoComplete="email" />
        </FormField>
        <FormField label="Password" error={errors.password?.message} id="password">
          <Input {...form.register("password")} aria-invalid={Boolean(errors.password)} id="password" placeholder="••••••••" type="password" autoComplete={isSignup ? "new-password" : "current-password"} />
        </FormField>

        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <label className="flex items-center gap-2" htmlFor="remember">
            <input id="remember" type="checkbox" className="size-4 rounded border-white/10 bg-white/[0.04]" {...form.register("remember")} />
            Remember me for 30 days
          </label>
          {!isSignup ? (
            <Link className="text-primary hover:text-cyan-glow" href="/forgot-password">
              Forgot password?
            </Link>
          ) : null}
        </div>

        {serverError || oauthError ? (
          <p className="rounded-lg border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100" role="alert">
            {serverError ?? oauthError}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSignup ? "Create Workspace" : "Sign In"}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        {isSignup ? "Already have access?" : "Don't have an account?"}{" "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-primary hover:text-cyan-glow">
          {isSignup ? "Sign in" : "Request access"}
        </Link>
      </p>
    </div>
  );
}
