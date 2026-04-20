"use client";

import * as React from "react";
import { PrismColorPicker } from "@ui";

export function PrismColorPickerDemo(): React.JSX.Element {
  const [selectedColorHex, setSelectedColorHex] = React.useState("#6750a4");

  return (
    <div className="max-w-md space-y-4">
      <PrismColorPicker
        selectedColorHex={selectedColorHex}
        onSelectedColorChange={setSelectedColorHex}
      />
    </div>
  );
}
