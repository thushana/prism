"use client";

import * as React from "react";
import {
  PrismColor,
  PrismColorPicker,
  PrismTypography,
  type PrismPaletteId,
} from "@ui";

const PALETTE_OPTIONS: { value: PrismPaletteId; label: string }[] = [
  { value: "default", label: "default (Material)" },
  { value: "tailwind", label: "tailwind" },
];

export function PrismColorPickerDemo(): React.JSX.Element {
  const [palette, setPalette] = React.useState<PrismPaletteId>("default");
  const [selectedColorHex, setSelectedColorHex] =
    React.useState("#6750a4");

  React.useEffect(() => {
    if (palette === "tailwind") {
      setSelectedColorHex(
        PrismColor.hex({ palette: "tailwind", family: "violet", shade: 500 }),
      );
    } else {
      setSelectedColorHex("#6750a4");
    }
  }, [palette]);

  return (
    <div className="max-w-md space-y-4">
      <div>
        <PrismTypography role="label" size="small" className="mb-1 block">
          palette
        </PrismTypography>
        <select
          className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
          value={palette}
          onChange={(e) =>
            setPalette(e.target.value as PrismPaletteId)
          }
        >
          {PALETTE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {/* Remount when palette changes so grid dimensions and selected token stay coherent. */}
      <PrismColorPicker
        key={palette}
        color={{ palette }}
        selectedColorHex={selectedColorHex}
        onSelectedColorChange={setSelectedColorHex}
      />
    </div>
  );
}
