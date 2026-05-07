"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const errors: Record<string, string> = {};
    if (!displayName.trim()) errors.name = "Name is required.";
    if (!email) errors.email = "Email is required.";
    if (!PASSWORD_REGEX.test(password)) {
      errors.password =
        "Password must be at least 8 characters and include one uppercase letter and one number.";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center mx-auto mb-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 10l4 4 8-8"
                stroke="var(--color-success)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2
            className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Check your email
          </h2>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] max-w-[300px] mx-auto">
            We sent a confirmation link to{" "}
            <span className="font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
              {email}
            </span>
            . Click it to activate your account.
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
          Create your account
        </h2>
        <p className="mt-1 text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
          Start planning your first group trip
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="name" required>
            Your name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="John Smith"
            error={fieldErrors.name}
          />
        </div>

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
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="you@example.com"
            error={fieldErrors.email}
          />
        </div>

        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="••••••••"
            error={fieldErrors.password}
          />
          {!fieldErrors.password && (
            <p className="mt-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
              {password.length === 0
                ? "Min 8 characters, one uppercase letter, one number"
                : PASSWORD_REGEX.test(password)
                  ? "Looks good"
                  : `${password.length < 8 ? "Too short · " : ""}${!/[A-Z]/.test(password) ? "Add an uppercase letter · " : ""}${!/\d/.test(password) ? "Add a number" : ""}`.replace(/ · $/, "")}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            placeholder="••••••••"
            error={fieldErrors.confirmPassword}
          />
        </div>

        <FormError message={error} />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading}
          className="w-full mt-2"
        >
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-[var(--font-weight-medium)] text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
