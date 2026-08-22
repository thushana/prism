"use client";

import { useSyncExternalStore } from "react";

const MATERIAL_SYMBOLS_FAMILY = '"Material Symbols Rounded"';

let materialSymbolsFontReady = false;
let materialSymbolsFontPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emitMaterialSymbolsFontReady(): void {
  for (const listener of listeners) {
    listener();
  }
}

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
        emitMaterialSymbolsFontReady();
      })
      .catch(() => {
        // Avoid permanent blank icons if the font request fails.
        materialSymbolsFontReady = true;
        emitMaterialSymbolsFontReady();
      });
  }
  return materialSymbolsFontPromise;
}

function subscribeMaterialSymbolsFontReady(
  onStoreChange: () => void
): () => void {
  listeners.add(onStoreChange);
  void ensureMaterialSymbolsFont();
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getMaterialSymbolsFontReadySnapshot(): boolean {
  return materialSymbolsFontReady;
}

function getMaterialSymbolsFontReadyServerSnapshot(): boolean {
  return false;
}

/**
 * True once Material Symbols Rounded is available (shared across icons).
 *
 * Uses `useSyncExternalStore` so SSR / hydration always see `false` (empty
 * glyph), matching the server HTML. Seeding `useState` from the module cache
 * caused hydration mismatches after the font had already loaded in the same
 * JS session (client nav / HMR).
 */
export function useMaterialSymbolsFontReady(): boolean {
  return useSyncExternalStore(
    subscribeMaterialSymbolsFontReady,
    getMaterialSymbolsFontReadySnapshot,
    getMaterialSymbolsFontReadyServerSnapshot
  );
}
