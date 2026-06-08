"use client";

import * as React from "react";
import { PrismButton, PrismIcon, PrismTypography } from "@ui";
import { cn } from "@utilities";
import { createPrismAuthClient } from "./client";

const signInFieldLabelClassName = "mb-1.5 block cursor-pointer";

// text-base (16px): iOS Safari auto-zooms focused inputs below 16px.
const signInFieldClassName = cn(
  "box-border h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-mono text-base font-normal shadow-xs transition-colors",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

interface SignInFormProps {
  error?: string;
  /** Better Auth base URL; omit for same-origin `/api/auth`. */
  authBaseURL?: string;
  /** When true, show passkey sign-in and browser autofill hints. */
  passkeys?: boolean;
  /** Path to open after successful sign-in (default `/`). */
  redirectTo?: string;
}

export function SignInForm({
  error,
  authBaseURL,
  passkeys = true,
  redirectTo = "/",
}: SignInFormProps) {
  const authClient = React.useMemo(
    () => createPrismAuthClient(authBaseURL),
    [authBaseURL]
  );
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPasskeySubmitting, setIsPasskeySubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | undefined>(
    error
  );

  React.useEffect(() => {
    if (!passkeys) return;
    if (
      typeof PublicKeyCredential === "undefined" ||
      !PublicKeyCredential.isConditionalMediationAvailable?.()
    ) {
      return;
    }

    void PublicKeyCredential.isConditionalMediationAvailable().then(
      (available) => {
        if (!available) return;
        void authClient.signIn.passkey({ autoFill: true }).then((result) => {
          if (!result.error) {
            window.location.assign(redirectTo);
          }
        });
      }
    );
  }, [authClient, passkeys, redirectTo]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(undefined);

    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      setSubmitError(
        result.error.message ?? "Sign in failed. Check your credentials."
      );
      setIsSubmitting(false);
      return;
    }

    window.location.assign(redirectTo);
  };

  const handlePasskeySignIn = async () => {
    setIsPasskeySubmitting(true);
    setSubmitError(undefined);

    const result = await authClient.signIn.passkey();

    if (result.error) {
      setSubmitError(result.error.message ?? "Passkey sign-in failed.");
      setIsPasskeySubmitting(false);
      return;
    }

    window.location.assign(redirectTo);
  };

  const busy = isSubmitting || isPasskeySubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <PrismTypography role="headline" size="regular" as="h1">
            Sign in
          </PrismTypography>
        </div>

        {passkeys ? (
          <div className="space-y-4">
            <PrismButton
              type="button"
              variant="plain"
              color={{ palette: "default", swatchPrimary: "blue" }}
              shape="rectangleRounded"
              label={
                isPasskeySubmitting
                  ? "Waiting for passkey…"
                  : "Sign in with passkey"
              }
              leadingSlot={
                <PrismIcon
                  name="passkey"
                  size="small"
                  className="text-current"
                />
              }
              disabled={busy}
              disableGrow
              className="w-full"
              onClick={() => void handlePasskeySignIn()}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {(submitError || error) && (
          <PrismTypography
            role="body"
            size="small"
            color={{ semanticText: "destructive" }}
          >
            {submitError || error}
          </PrismTypography>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={signInFieldLabelClassName}>
              <PrismTypography
                role="overline"
                size="small"
                fontWeight={900}
                textTransform="uppercase"
                color={{ semanticText: "muted" }}
                as="span"
              >
                Email
              </PrismTypography>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete={passkeys ? "username webauthn" : "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className={cn(
                signInFieldClassName,
                (submitError || error) && "border-destructive"
              )}
              placeholder="you@example.com"
              required
              autoFocus={!passkeys}
            />
          </div>

          <div>
            <label htmlFor="password" className={signInFieldLabelClassName}>
              <PrismTypography
                role="overline"
                size="small"
                fontWeight={900}
                textTransform="uppercase"
                color={{ semanticText: "muted" }}
                as="span"
              >
                Password
              </PrismTypography>
            </label>
            <div className="relative h-9">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  passkeys ? "current-password webauthn" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className={cn(
                  signInFieldClassName,
                  "pr-10",
                  (submitError || error) && "border-destructive"
                )}
                placeholder="Password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={busy}
                onClick={() => setShowPassword((visible) => !visible)}
                className={cn(
                  "absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center",
                  "rounded-sm text-muted-foreground hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                <PrismIcon
                  iconStyle="lucide"
                  name={showPassword ? "eye-off" : "eye"}
                  size={14}
                  weight="thin"
                  className="pointer-events-none shrink-0 text-current"
                />
              </button>
            </div>
          </div>

          <PrismButton
            type="submit"
            variant="plain"
            color={{ palette: "default", swatchPrimary: "blue" }}
            shape="rectangleRounded"
            label={isSubmitting ? "Signing in…" : "Sign in"}
            leadingSlot={
              <PrismIcon name="login" size="small" className="text-current" />
            }
            disabled={busy}
            disableGrow
            className="w-full"
          />
        </form>
      </div>
    </div>
  );
}
