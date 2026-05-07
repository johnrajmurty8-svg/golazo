"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const errors: Record<string, string> = {};
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
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Sign out so user logs in fresh with new password
    await supabase.auth.signOut();
    router.push("/login?reset=success");
  }

  return (
    <AuthCard>
      <div className="mb-6">
        <h2
          className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Set a new password
        </h2>
        <p className="mt-1 text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
          Choose something you&apos;ll remember
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="password" required>
            New password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={fieldErrors.password}
          />
          {!fieldErrors.password && (
            <p className="mt-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
              Min 8 characters, one uppercase letter, one number
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>
            Confirm new password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          className="w-full mt-2"
        >
          Update password
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
