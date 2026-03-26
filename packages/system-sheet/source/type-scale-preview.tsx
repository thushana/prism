"use client";

import { useMemo, useState } from "react";
import { PrismButton, PrismTypography } from "@ui";
import type { PrismTypographyRole, PrismTypographySize } from "@ui";

interface TypefaceOption {
  id: "satoshi" | "sentient" | "zodiak" | "geistMono";
  label: string;
  className: string;
  cssVariable: string;
}

interface TypeScalePreviewProps {
  satoshiVariableClass: string;
  sentientVariableClass: string;
  zodiakVariableClass: string;
  geistMonoVariableClass: string;
}

const TYPE_SCALE_ITEMS: ReadonlyArray<{
  role: PrismTypographyRole;
  size: PrismTypographySize;
  label: string;
}> = [
  { role: "display", size: "large", label: "display · large" },
  { role: "display", size: "medium", label: "display · medium" },
  { role: "display", size: "small", label: "display · small" },
  { role: "headline", size: "large", label: "headline · large" },
  { role: "headline", size: "medium", label: "headline · medium" },
  { role: "headline", size: "small", label: "headline · small" },
  { role: "title", size: "large", label: "title · large" },
  { role: "title", size: "medium", label: "title · medium" },
  { role: "title", size: "small", label: "title · small" },
  { role: "body", size: "large", label: "body · large" },
  { role: "body", size: "medium", label: "body · medium" },
  { role: "body", size: "small", label: "body · small" },
  { role: "label", size: "large", label: "label · large" },
  { role: "label", size: "medium", label: "label · medium" },
  { role: "label", size: "small", label: "label · small" },
  { role: "overline", size: "large", label: "overline · large" },
  { role: "overline", size: "medium", label: "overline · medium" },
  { role: "overline", size: "small", label: "overline · small" },
];

export function TypeScalePreview({
  satoshiVariableClass,
  sentientVariableClass,
  zodiakVariableClass,
  geistMonoVariableClass,
}: TypeScalePreviewProps): React.JSX.Element {
  const typefaces = useMemo<TypefaceOption[]>(
    () => [
      {
        id: "satoshi",
        label: "Satoshi (Sans)",
        className: satoshiVariableClass,
        cssVariable: "var(--font-satoshi)",
      },
      {
        id: "sentient",
        label: "Sentient (Serif)",
        className: sentientVariableClass,
        cssVariable: "var(--font-sentient)",
      },
      {
        id: "zodiak",
        label: "Zodiak (Serif Display)",
        className: zodiakVariableClass,
        cssVariable: "var(--font-zodiak)",
      },
      {
        id: "geistMono",
        label: "Geist Mono",
        className: geistMonoVariableClass,
        cssVariable: "var(--font-geist-mono)",
      },
    ],
    [
      satoshiVariableClass,
      sentientVariableClass,
      zodiakVariableClass,
      geistMonoVariableClass,
    ]
  );

  const [selectedTypefaceId, setSelectedTypefaceId] =
    useState<TypefaceOption["id"]>("satoshi");
  const [hoveredTypefaceId, setHoveredTypefaceId] = useState<
    TypefaceOption["id"] | null
  >(null);

  const activeTypefaceId = hoveredTypefaceId ?? selectedTypefaceId;
  const activeTypeface =
    typefaces.find((typeface) => typeface.id === activeTypefaceId) ?? typefaces[0];

  return (
    <div className="mb-8">
      <h3 className="mb-4">Type scale (role × size)</h3>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {typefaces.map((typeface) => (
          <PrismButton
            key={typeface.id}
            label={typeface.label}
            color="monochrome"
            shapeRectangle
            shapeLineBottom
            stateToggled={activeTypefaceId === typeface.id}
            onClick={() => setSelectedTypefaceId(typeface.id)}
            onMouseEnter={() => setHoveredTypefaceId(typeface.id)}
            onMouseLeave={() => setHoveredTypefaceId(null)}
            onFocus={() => setHoveredTypefaceId(typeface.id)}
            onBlur={() => setHoveredTypefaceId(null)}
          />
        ))}
      </div>
      <div className="space-y-3 border-b pb-4">
        {TYPE_SCALE_ITEMS.map((item) => (
          <div key={`${item.role}-${item.size}`}>
            <code className="text-xs text-muted-foreground">
              {`typography-${item.role}-${item.size}`}
            </code>
            <PrismTypography
              role={item.role}
              size={item.size}
              className={`mt-1 block ${activeTypeface.className}`}
              style={{ fontFamily: activeTypeface.cssVariable }}
            >
              {item.label}
            </PrismTypography>
          </div>
        ))}
      </div>
    </div>
  );
}
