"use client";

import { useEffect, useState } from "react";

/** How long a copy control shows its copied state before returning to idle. */
export const PRISM_CLIPBOARD_COPIED_RESET_MILLISECONDS = 1600;

/**
 * Deep-link URL for the current page plus `#id`.
 * Pass `location` so tests do not need a browser.
 */
export function prismLocationHashUrl(
  id: string,
  location: { origin: string; pathname: string; search: string }
): string {
  return `${location.origin}${location.pathname}${location.search}#${id}`;
}

/**
 * Clipboard write plus a short copied flag. Callers keep their own chrome
 * (heading affordance, badge, icon button) and their own history update.
 */
export function usePrismClipboardCopy(): {
  copied: boolean;
  copyText: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(
      () => setCopied(false),
      PRISM_CLIPBOARD_COPIED_RESET_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard can fail off secure contexts. Callers may already have updated the hash.
    }
  }

  return { copied, copyText };
}
