"use client";

import * as React from "react";
import { PrismButton, PrismTypography } from "@ui";
import { createPrismAuthClient } from "./client";

/**
 * Change-password form bound to Better Auth (`authClient.changePassword`).
 * Submit stays disabled until both fields have content.
 */
export function ChangePasswordForm({
  authBaseURL,
}: {
  /** Better Auth base URL; omit for same-origin. */
  authBaseURL?: string;
}) {
  const authClient = React.useMemo(
    () => createPrismAuthClient(authBaseURL),
    [authBaseURL]
  );
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const hasContent =
    currentPassword.trim().length > 0 && newPassword.trim().length > 0;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (result.error) {
        setError(result.error.message ?? "Could not change password");
        return;
      }
      setMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unexpected error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="grid gap-2">
        <PrismTypography
          role="overline"
          size="small"
          color={{ semanticText: "muted" }}
        >
          Current password
        </PrismTypography>
        <input
          type="password"
          autoComplete="current-password"
          required
          minLength={12}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2"
        />
      </label>
      <label className="grid gap-2">
        <PrismTypography
          role="overline"
          size="small"
          color={{ semanticText: "muted" }}
        >
          New password
        </PrismTypography>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2"
        />
      </label>
      {error ? (
        <PrismTypography
          role="body"
          size="small"
          color={{ semanticText: "destructive" }}
        >
          {error}
        </PrismTypography>
      ) : null}
      {message ? (
        <PrismTypography role="body" size="small">
          {message}
        </PrismTypography>
      ) : null}
      <PrismButton
        type="submit"
        variant="icon"
        color={{
          palette: "default",
          swatchPrimary: hasContent ? "blue" : "grey",
        }}
        shape="rectangleRounded"
        materialSymbol="lock"
        label={pending ? "Saving…" : "Change password"}
        disabled={pending || !hasContent}
        disableGrow
      />
    </form>
  );
}
