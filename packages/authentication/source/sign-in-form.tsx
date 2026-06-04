"use client";

import * as React from "react";
import { PrismButton, PrismTypography } from "@ui";
import { cn } from "@utilities";

interface SignInFormProps {
  error?: string;
}

export function SignInForm({ error }: SignInFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | undefined>(
    error
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        setSubmitError(
          data.message ??
            data.error ??
            "Sign in failed. Check your credentials."
        );
        setIsSubmitting(false);
        return;
      }

      window.location.reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Try again.";
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <PrismTypography role="headline" size="regular" as="h1">
            Sign in
          </PrismTypography>
          <PrismTypography
            role="body"
            size="regular"
            color={{ semanticText: "muted" }}
            className="mt-2"
          >
            Use your account email and password
          </PrismTypography>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block cursor-pointer">
              <PrismTypography role="label" size="regular" as="span">
                Email
              </PrismTypography>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                (submitError || error) && "border-destructive"
              )}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block cursor-pointer">
              <PrismTypography role="label" size="regular" as="span">
                Password
              </PrismTypography>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                (submitError || error) && "border-destructive"
              )}
              placeholder="Password"
              required
            />
          </div>

          {(submitError || error) && (
            <PrismTypography
              role="body"
              size="small"
              color={{ semanticText: "destructive" }}
            >
              {submitError || error}
            </PrismTypography>
          )}

          <PrismButton
            type="submit"
            variant="plain"
            color={{ palette: "default", swatchPrimary: "blue" }}
            shape="rectangleRounded"
            label={isSubmitting ? "Signing in…" : "Sign in"}
            disabled={isSubmitting}
            disableGrow
            className="w-full"
          />
        </form>
      </div>
    </div>
  );
}
