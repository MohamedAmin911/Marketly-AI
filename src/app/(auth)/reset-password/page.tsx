import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/password-reset-form";
import { ResetLoading } from "@/features/auth/components/reset-loading";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<ResetLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
