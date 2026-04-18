"use client";

import * as React from "react";
import { PrismButton, PrismTypography } from "@ui";
import { cn } from "@utilities";

interface PasswordFormProps {
  error?: string;
}

export function PasswordForm({ error }: PasswordFormProps) {
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
      const response = await fetch("/api/admin/authentication", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSubmitError(data.error || "Authentication failed");
        setIsSubmitting(false);
        return;
      }

      // Reload page to show authenticated content
      window.location.reload();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      setSubmitError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <PrismTypography role="headline" size="medium" as="h1">
            Authentication Required
          </PrismTypography>
          <PrismTypography role="body" size="medium" color="muted" className="mt-2">
            Please enter the password to access this page
          </PrismTypography>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block cursor-pointer">
              <PrismTypography role="label" size="medium" as="span">
                Password
              </PrismTypography>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                (submitError || error) && "border-destructive"
              )}
              placeholder="Enter password"
              required
              autoFocus
            />
            {(submitError || error) && (
              <PrismTypography
                role="body"
                size="small"
                color="destructive"
                className="mt-2"
              >
                {submitError || error}
              </PrismTypography>
            )}
          </div>

          <PrismButton
            type="submit"
            variant="plain"
            color="blue"
            rectangleRounded
            label={isSubmitting ? "Authenticating…" : "Authenticate"}
            disabled={isSubmitting}
            noGrow
            className="w-full"
          />
        </form>
      </div>
    </div>
  );
}
