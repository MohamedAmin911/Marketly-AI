"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing verification token.");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.error?.message || "Invalid or expired verification token.");
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again later.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      {status === "loading" && (
        <div className="space-y-4">
          <Loader2 className="mx-auto size-12 animate-spin text-primary" />
          <h1 className="font-display text-2xl font-semibold text-white">Verifying your email...</h1>
          <p className="text-muted">Please wait while we verify your account.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="mx-auto size-16 text-primary" />
          <h1 className="font-display text-3xl font-semibold text-white">Email Verified!</h1>
          <p className="text-muted">Your account has been successfully verified.</p>
          <div className="pt-6">
            <Button asChild>
              <Link href="/login">Continue to Login</Link>
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
          <XCircle className="mx-auto size-16 text-red-500" />
          <h1 className="font-display text-3xl font-semibold text-white">Verification Failed</h1>
          <p className="text-muted max-w-sm mx-auto">{errorMessage}</p>
          <div className="pt-6">
            <Button variant="outline" asChild>
              <Link href="/login">Return to Login</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <Loader2 className="mx-auto size-12 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
