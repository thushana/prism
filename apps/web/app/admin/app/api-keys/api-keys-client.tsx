"use client";

import * as React from "react";
import { PrismButton, PrismTypography } from "@ui";

interface ApiKeysClientProps {
  userId: string;
}

export function ApiKeysClient({ userId }: ApiKeysClientProps) {
  const [name, setName] = React.useState("");
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(undefined);
    setCreatedKey(null);

    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() || "API key", userId }),
      });

      const data = (await response.json()) as {
        key?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Failed to create API key");
        return;
      }

      if (data.key) {
        setCreatedKey(data.key);
        setName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label htmlFor="key-name" className="mb-2 block">
            <PrismTypography role="label" size="regular" as="span">
              Key name
            </PrismTypography>
          </label>
          <input
            id="key-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            placeholder="Chrome extension"
          />
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
        <PrismButton
          type="submit"
          variant="plain"
          color={{ palette: "default", swatchPrimary: "blue" }}
          shape="rectangleRounded"
          label={isSubmitting ? "Creating…" : "Create API key"}
          disabled={isSubmitting}
          disableGrow
        />
      </form>

      {createdKey && (
        <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
          <PrismTypography role="title" size="small" font="sans">
            Copy this key now
          </PrismTypography>
          <PrismTypography role="body" size="small" as="p">
            It will not be shown again. Use header{" "}
            <code className="text-xs">x-api-key</code>.
          </PrismTypography>
          <code className="block break-all text-xs">{createdKey}</code>
        </div>
      )}
    </div>
  );
}
