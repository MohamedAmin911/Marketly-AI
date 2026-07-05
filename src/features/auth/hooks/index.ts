"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import { login, signup } from "@/features/auth/services/auth-service";
import { loginSchema, signupSchema, type LoginFormValues, type SignupFormValues } from "@/features/auth/utils/schema";

export type AuthMode = "login" | "signup";

export function useAuthForm(mode: AuthMode) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const isSignup = mode === "signup";

  const form = useForm<LoginFormValues | SignupFormValues>({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
    defaultValues: isSignup
      ? { email: "", password: "", remember: true, name: "", company: "" }
      : { email: "", password: "", remember: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError("");
    setIsSuccess(false);

    try {
      if (isSignup) {
        await signup(values as SignupFormValues);
        setIsSuccess(true);
      } else {
        await login(values as LoginFormValues);
        window.location.href = "/dashboard";
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "We could not complete authentication. Check your credentials and try again.");
    }
  });

  return {
    form,
    isSignup,
    isSuccess,
    onSubmit,
    serverError,
  };
}

export function useUser() {
  const query = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.data?.user as { email: string; name: string }) ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
  };
}
