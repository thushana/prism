"use client";

import type { JSX } from "react";
import { PrismButton } from "@ui";
import { Settings } from "lucide-react";

/** System sheet preview row — Prism is client; the sheet page is a server component. */
export function SystemSheetButtonExamples(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PrismButton color="blue" label="Primary" variant="plain" />
      <PrismButton
        color="grey"
        label="Secondary"
        variant="plain"
        colorVariant="monochrome"
      />
      <PrismButton color="red" label="Destructive" variant="plain" />
      <PrismButton
        color="blue"
        label="With icon"
        variant="icon"
        icon={Settings}
      />
      <PrismButton color="blue" label="Small" variant="plain" size="small" />
      <PrismButton color="blue" label="Large" variant="plain" size="large" />
    </div>
  );
}
