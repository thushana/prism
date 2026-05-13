/**
 * Shared map types for Prism dual-vendor maps (see `prism-map.tsx` JSDoc for peer vs vendor props).
 */

export type PrismMapVendor = "google" | "mapbox";

export type PrismMapRoute = {
  id: string;
  encodedPolyline: string;
  strokeColor: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  /**
   * Draw order: higher values render above lower (Google `Polyline` `zIndex`, Mapbox `line-sort-key`).
   * Use for hover / selection so the active route stays visually on top.
   */
  stackOrder?: number;
};

export type PrismMapShell = "none" | "card";
