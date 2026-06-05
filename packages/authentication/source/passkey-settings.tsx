"use client";

import * as React from "react";
import { PrismButton, PrismTypography } from "@ui";
import { cn } from "@utilities";
import { createPrismAuthClient } from "./client";

interface PasskeySettingsProps {
  /** Better Auth base URL; omit for same-origin. */
  authBaseURL?: string;
  className?: string;
}

export function PasskeySettings({
  authBaseURL,
  className,
}: PasskeySettingsProps) {
  const authClient = React.useMemo(
    () => createPrismAuthClient(authBaseURL),
    [authBaseURL]
  );
  const [passkeys, setPasskeys] = React.useState<
    Array<{ id: string; name?: string | null; createdAt?: Date | null }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    let cancelled = false;

    authClient.passkey
      .listUserPasskeys()
      .then((result) => {
        if (cancelled) return;
        if (result.error) {
          setError(result.error.message ?? "Could not load passkeys.");
          setPasskeys([]);
        } else {
          setPasskeys(result.data ?? []);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load passkeys.");
        setPasskeys([]);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authClient]);

  const handleAddPasskey = async () => {
    setIsAdding(true);
    setError(undefined);
    const addResult = await authClient.passkey.addPasskey({
      name: `Passkey ${passkeys.length + 1}`,
    });
    if (addResult.error) {
      setError(addResult.error.message ?? "Could not add passkey.");
      setIsAdding(false);
      return;
    }
    const listResult = await authClient.passkey.listUserPasskeys();
    if (!listResult.error) setPasskeys(listResult.data ?? []);
    setIsAdding(false);
  };

  const handleDeletePasskey = async (id: string) => {
    setDeletingId(id);
    setError(undefined);
    const result = await authClient.passkey.deletePasskey({ id });
    if (result.error) {
      setError(result.error.message ?? "Could not remove passkey.");
    } else {
      setPasskeys((current) => current.filter((item) => item.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <PrismTypography role="title" size="large" as="h2">
          Passkeys
        </PrismTypography>
        <PrismTypography
          role="body"
          size="regular"
          color={{ semanticText: "muted" }}
        >
          Sign in with Face ID, Touch ID, or a security key after registering a
          passkey while signed in.
        </PrismTypography>
      </div>

      {error && (
        <PrismTypography
          role="body"
          size="small"
          color={{ semanticText: "destructive" }}
        >
          {error}
        </PrismTypography>
      )}

      {isLoading ? (
        <PrismTypography
          role="body"
          size="regular"
          color={{ semanticText: "muted" }}
        >
          Loading passkeys…
        </PrismTypography>
      ) : passkeys.length === 0 ? (
        <PrismTypography
          role="body"
          size="regular"
          color={{ semanticText: "muted" }}
        >
          No passkeys registered yet.
        </PrismTypography>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {passkeys.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <PrismTypography role="body" size="regular" as="p">
                  {item.name ?? "Passkey"}
                </PrismTypography>
                {item.createdAt && (
                  <PrismTypography
                    role="body"
                    size="small"
                    color={{ semanticText: "muted" }}
                  >
                    Added {new Date(item.createdAt).toLocaleDateString()}
                  </PrismTypography>
                )}
              </div>
              <PrismButton
                type="button"
                variant="plain"
                color={{ palette: "default", swatchPrimary: "red" }}
                shape="rectangleRounded"
                label={deletingId === item.id ? "Removing…" : "Remove"}
                disabled={deletingId !== null}
                disableGrow
                onClick={() => void handleDeletePasskey(item.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <PrismButton
        type="button"
        variant="plain"
        color={{ palette: "default", swatchPrimary: "blue" }}
        shape="rectangleRounded"
        label={isAdding ? "Waiting for device…" : "Add passkey"}
        disabled={isAdding || isLoading}
        disableGrow
        onClick={() => void handleAddPasskey()}
      />
    </div>
  );
}
