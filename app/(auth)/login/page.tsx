"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/trips";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Show success message if user just reset their password
  const justReset = searchParams.get("reset") === "success";

  function validateFields() {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email address is required.";
    if (!password) errors.password = "Password is required.";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <AuthCard>
      <div className="mb-6">
        <h2
          className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Welcome back
        </h2>
        <p className="mt-1 text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
          Sign in to your trips
        </p>
      </div>

      {justReset && (
        <div className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] px-3 py-2.5 text-[var(--font-size-sm)] text-[var(--color-success)]">
          Password updated successfully. Sign in with your new password.
        </div>
      )}

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
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="you@example.com"
            error={fieldErrors.email}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" required className="mb-0">
              Password
            </Label>
            <Link
              href="/reset-password"
              className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              if (error) setError(null);
            }}
            placeholder="••••••••"
            error={fieldErrors.password}
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
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-[var(--font-weight-medium)] text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div className="h-48 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
          </div>
        </AuthCard>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
