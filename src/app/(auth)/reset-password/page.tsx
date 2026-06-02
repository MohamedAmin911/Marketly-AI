import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/password-reset-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="text-center text-sm text-muted">Loading reset flow...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
