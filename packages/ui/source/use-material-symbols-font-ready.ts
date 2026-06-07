"use client";

import { useEffect, useState } from "react";

const MATERIAL_SYMBOLS_FAMILY = '"Material Symbols Rounded"';

let materialSymbolsFontReady = false;
let materialSymbolsFontPromise: Promise<void> | null = null;

function ensureMaterialSymbolsFont(): Promise<void> {
  if (materialSymbolsFontReady) {
    return Promise.resolve();
  }
  if (typeof document === "undefined") {
    return Promise.resolve();
  }
  if (!materialSymbolsFontPromise) {
    materialSymbolsFontPromise = document.fonts
      .load(`400 24px ${MATERIAL_SYMBOLS_FAMILY}`)
      .then(() => {
        materialSymbolsFontReady = true;
      })
      .catch(() => {
        // Avoid permanent blank icons if the font request fails.
        materialSymbolsFontReady = true;
      });
  }
  return materialSymbolsFontPromise;
}

/** True once Material Symbols Rounded is available (shared across icons). */
export function useMaterialSymbolsFontReady(): boolean {
  const [ready, setReady] = useState(materialSymbolsFontReady);

  useEffect(() => {
    if (materialSymbolsFontReady) {
      setReady(true);
      return;
    }
    void ensureMaterialSymbolsFont().then(() => setReady(true));
  }, []);

  return ready;
}
