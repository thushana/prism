"use client";

import * as React from "react";
import { Button } from "@ui";
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
          <h1 className="text-2xl font-semibold">Authentication Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please enter the password to access this page
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
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
              <p className="mt-2 text-sm text-destructive">
                {submitError || error}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Authenticating..." : "Authenticate"}
          </Button>
        </form>
      </div>
    </div>
  );
}
