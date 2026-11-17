/**
 * Shared map types for Prism multi-vendor maps (see `prism-map.tsx` JSDoc for peer vs vendor props).
 */

export type PrismMapVendor = "google" | "mapbox" | "maplibre";

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
  /**
   * Chart-aligned clock key `HH:MM` (24h) for app-driven selection / labels; ignored by map rendering.
   */
  chartSlotLabel?: string;
  /**
   * When false, skip start/end markers for this route. Default: show S/E dots at polyline ends.
   */
  showEndpoints?: boolean;
};

/** WGS84 Polygon / MultiPolygon for containment / place bounds overlays. */
export type PrismMapPolygonGeometry =
  | {
      type: "Polygon";
      coordinates: number[][][];
    }
  | {
      type: "MultiPolygon";
      coordinates: number[][][][];
    };

export type PrismMapPolygon = {
  id: string;
  geometry: PrismMapPolygonGeometry;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
};

export type PrismMapShell = "none" | "card";
