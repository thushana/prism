/**
 * Shared GeoJSON helpers for {@link PrismMap} polygon overlays (all vendors).
 */

import type { PrismMapPolygon } from "./prism-map-types";

export type PrismMapPolygonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: {
      polygonId: string;
      fillColor: string;
      fillOpacity: number;
      strokeColor: string;
      strokeOpacity: number;
      strokeWeight: number;
    };
    geometry: PrismMapPolygon["geometry"];
  }>;
};

const DEFAULT_FILL = "#2563eb";
const DEFAULT_STROKE = "#2563eb";

export function buildPolygonFeatureCollection(
  polygons: PrismMapPolygon[]
): PrismMapPolygonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: polygons.map((polygon) => {
      const strokeColor = polygon.strokeColor ?? polygon.fillColor ?? DEFAULT_STROKE;
      return {
        type: "Feature" as const,
        id: polygon.id,
        properties: {
          polygonId: polygon.id,
          fillColor: polygon.fillColor ?? DEFAULT_FILL,
          fillOpacity: polygon.fillOpacity ?? 0.28,
          strokeColor,
          strokeOpacity: polygon.strokeOpacity ?? 0.9,
          strokeWeight: polygon.strokeWeight ?? 2,
        },
        geometry: polygon.geometry,
      };
    }),
  };
}

export function polygonsGeometrySignature(polygons: PrismMapPolygon[]): string {
  return polygons
    .map((p) => `${p.id}\n${JSON.stringify(p.geometry)}`)
    .join("\u0001");
}

/** Combined routes + polygons geometry signature for autoFit gating. */
export function mapOverlayContentSignature(
  routeGeometryParts: string[],
  polygons: PrismMapPolygon[]
): string {
  return `${routeGeometryParts.join("\u0001")}\u0002${polygonsGeometrySignature(polygons)}`;
}

/** Iterate exterior+interior ring positions as `[lng, lat]`. */
export function forEachPolygonPosition(
  geometry: PrismMapPolygon["geometry"],
  visit: (lng: number, lat: number) => void
): void {
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      for (const position of ring) {
        const lng = position[0];
        const lat = position[1];
        if (typeof lng === "number" && typeof lat === "number") {
          visit(lng, lat);
        }
      }
    }
    return;
  }
  for (const polygon of geometry.coordinates) {
    for (const ring of polygon) {
      for (const position of ring) {
        const lng = position[0];
        const lat = position[1];
        if (typeof lng === "number" && typeof lat === "number") {
          visit(lng, lat);
        }
      }
    }
  }
}
