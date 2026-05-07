"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      }
    );

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mx-auto mb-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 18V12h4v6"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2
            className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Check your inbox
          </h2>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] max-w-[300px] mx-auto">
            We sent a reset link to{" "}
            <span className="font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
              {email}
            </span>
            . The link expires in 1 hour.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="mb-6">
        <h2
          className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Reset your password
        </h2>
        <p className="mt-1 text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email" required>
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <FormError message={error} />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          Send reset link
        </Button>
      </form>

      <p className="mt-5 text-center text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
        <Link
          href="/login"
          className="font-[var(--font-weight-medium)] text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
