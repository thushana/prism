"use client";

import * as React from "react";
import { PrismButton } from "@ui";

export type SignOutFormAppearance = "text" | "button" | "frameless";

/**
 * Form that POSTs to /api/admin/signout to clear the authentication cookie.
 *
 * - `appearance="text"` — quiet admin chrome (default)
 * - `appearance="button"` — filled control
 * - `appearance="frameless"` — monochrome rectangle, no line (account chrome)
 */
export function SignOutForm({
  appearance = "text",
  segmentPosition,
}: {
  appearance?: SignOutFormAppearance;
  segmentPosition?: "first" | "middle" | "last";
} = {}): React.JSX.Element {
  let button: React.JSX.Element;

  if (appearance === "frameless") {
    button = (
      <PrismButton
        type="submit"
        variant="icon"
        color={{ palette: "default", swatchPrimary: "grey" }}
        materialSymbol="logout"
        label="Sign out"
        shape="rectangle"
        line="none"
        gap="none"
        segmentPosition={segmentPosition}
        paint="monochrome"
        disableGrow
      />
    );
  } else if (appearance === "button") {
    button = (
      <PrismButton
        type="submit"
        variant="icon"
        shape="rectangleRounded"
        color={{ palette: "default", swatchPrimary: "grey" }}
        materialSymbol="logout"
        label="Sign out"
        disableGrow
      />
    );
  } else {
    button = (
      <PrismButton
        type="submit"
        variant="plain"
        label="Sign out"
        textCase="uppercase"
        color={{ palette: "default", swatchPrimary: "grey" }}
        paint="backgroundNone"
        disableColorChange
        line="none"
        size="small"
        className="py-0! px-1! text-muted-foreground! hover:text-foreground!"
      />
    );
  }

  return (
    <form action="/api/admin/signout" method="POST" className="inline">
      {button}
    </form>
  );
}
