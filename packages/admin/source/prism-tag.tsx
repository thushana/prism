"use client";

import {
  PrismTag,
  PrismTypography,
  type PartialPrismColorSpec,
  type PrismSwatchKey,
} from "@ui";
import { useState, type JSX } from "react";

/** Material default-palette families — same vocabulary as PrismColor / PrismButton demos. */
const COLOR_TAG_EXAMPLES: {
  id: string;
  label: string;
  swatchPrimary: PrismSwatchKey;
}[] = [
  { id: "red", label: "red", swatchPrimary: "red" },
  { id: "pink", label: "pink", swatchPrimary: "pink" },
  { id: "purple", label: "purple", swatchPrimary: "purple" },
  { id: "deep-purple", label: "deep-purple", swatchPrimary: "deep-purple" },
  { id: "indigo", label: "indigo", swatchPrimary: "indigo" },
  { id: "blue", label: "blue", swatchPrimary: "blue" },
  { id: "light-blue", label: "light-blue", swatchPrimary: "light-blue" },
  { id: "cyan", label: "cyan", swatchPrimary: "cyan" },
  { id: "teal", label: "teal", swatchPrimary: "teal" },
  { id: "green", label: "green", swatchPrimary: "green" },
  { id: "amber", label: "amber", swatchPrimary: "amber" },
  { id: "orange", label: "orange", swatchPrimary: "orange" },
];

function tagColor(swatchPrimary: PrismSwatchKey): PartialPrismColorSpec {
  return { palette: "default", swatchPrimary, shade: 500 };
}

/**
 * Admin playground for {@link PrismTag} at
 * http://city-observatory.localhost:1894/admin/prism/components/prism-tag
 */
export function PrismTagDemo(): JSX.Element {
  const [editableTags, setEditableTags] = useState(COLOR_TAG_EXAMPLES);

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <PrismTypography role="title" size="large" fontWeight={700}>
          PrismTag
        </PrismTypography>
        <PrismTypography role="body" color={{ semanticText: "muted" }}>
          Opinionated chip on PrismButton —{" "}
          <code>paint=&quot;backgroundLight&quot;</code> (shade 100 fill, 800
          label), no border. Pass a PrismColor <code>swatchPrimary</code>. Set{" "}
          <code>editable</code> so hover or focus reveals a trailing close
          control.
        </PrismTypography>
      </div>

      <div className="grid gap-3">
        <PrismTypography role="overline" size="small">
          Display — default palette families
        </PrismTypography>
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_TAG_EXAMPLES.map((tag) => (
            <PrismTag
              key={tag.id}
              label={tag.label}
              color={tagColor(tag.swatchPrimary)}
              materialSymbol="palette"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <PrismTypography role="overline" size="small">
          Editable — hover or focus to remove
        </PrismTypography>
        <div className="flex flex-wrap items-center gap-2">
          {editableTags.map((tag) => (
            <PrismTag
              key={tag.id}
              label={tag.label}
              color={tagColor(tag.swatchPrimary)}
              materialSymbol="palette"
              editable
              onRemove={() =>
                setEditableTags((previous) =>
                  previous.filter((row) => row.id !== tag.id)
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
