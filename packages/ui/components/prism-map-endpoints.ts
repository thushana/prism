import { decodeEncodedPolyline, type LatLng } from "../source/polyline-decode";
import type { PrismMapRoute } from "./prism-map-types";

export type RouteEndpointKind = "start" | "end";

export const ROUTE_ENDPOINT_LABEL: Record<RouteEndpointKind, string> = {
  start: "S",
  end: "E",
};

/** ~15 m — merge sampled routes that share the same commute origin/destination. */
const DEDUPE_POSITION_EPSILON = 0.00015;

export type MapEndpointMarker = {
  id: string;
  kind: RouteEndpointKind;
  position: LatLng;
  fillColor: string;
  fillOpacity: number;
  stackOrder: number;
};

export type RouteEndpointFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: {
      label: string;
      fillColor: string;
      fillOpacity: number;
      stackOrder: number;
    };
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

/** Keep S/E readable when route lines are drawn faint for chart slot emphasis. */
export function routeEndpointFillOpacity(strokeOpacity: number): number {
  return Math.max(strokeOpacity, 0.55);
}

function positionsNear(a: LatLng, b: LatLng): boolean {
  return (
    Math.abs(a.lat - b.lat) < DEDUPE_POSITION_EPSILON &&
    Math.abs(a.lng - b.lng) < DEDUPE_POSITION_EPSILON
  );
}

function averagePosition(points: LatLng[]): LatLng {
  const n = points.length;
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / n, lng: lng / n };
}

type EndpointCandidate = Omit<MapEndpointMarker, "id"> & { routeId: string };

function endpointCandidatesFromRoute(
  route: PrismMapRoute
): EndpointCandidate[] {
  const path = decodeEncodedPolyline(route.encodedPolyline);
  if (path.length === 0) return [];

  const strokeOpacity = routeEndpointFillOpacity(route.strokeOpacity ?? 0.2);
  const stackOrder = (route.stackOrder ?? 0) + 1;
  const base = {
    routeId: route.id,
    fillColor: route.strokeColor,
    fillOpacity: strokeOpacity,
    stackOrder,
  };

  const start = path[0]!;
  const end = path[path.length - 1]!;
  if (positionsNear(start, end)) {
    return [{ kind: "start", position: start, ...base }];
  }

  return [
    { kind: "start", position: start, ...base },
    { kind: "end", position: end, ...base },
  ];
}

function clusterCandidates(
  candidates: EndpointCandidate[]
): EndpointCandidate[] {
  const clusters: EndpointCandidate[][] = [];

  for (const candidate of candidates) {
    const cluster = clusters.find((group) =>
      positionsNear(group[0]!.position, candidate.position)
    );
    if (cluster) {
      cluster.push(candidate);
    } else {
      clusters.push([candidate]);
    }
  }

  return clusters.map((cluster) => {
    const best = cluster.reduce((a, b) =>
      b.stackOrder > a.stackOrder ? b : a
    );
    return {
      ...best,
      position: averagePosition(cluster.map((c) => c.position)),
    };
  });
}

function markerId(marker: EndpointCandidate, dedupe: boolean): string {
  if (!dedupe) {
    return `${marker.routeId}:${marker.kind}`;
  }
  return `${marker.kind}:${marker.position.lat.toFixed(5)},${marker.position.lng.toFixed(5)}`;
}

/**
 * One S/E per distinct location for the whole map. Sampled time-slot routes for the
 * same journey share endpoints — avoids stacked duplicate markers.
 */
export function collectMapEndpointMarkers(
  routes: PrismMapRoute[],
  options: { dedupe?: boolean } = {}
): MapEndpointMarker[] {
  const dedupe = options.dedupe !== false;
  const candidates: EndpointCandidate[] = [];

  for (const route of routes) {
    if (route.showEndpoints === false) continue;
    candidates.push(...endpointCandidatesFromRoute(route));
  }

  const markers: EndpointCandidate[] = dedupe
    ? (["start", "end"] as const).flatMap((kind) =>
        clusterCandidates(candidates.filter((c) => c.kind === kind))
      )
    : candidates;

  return markers.map((marker) => {
    const { routeId: _routeId, ...rest } = marker;
    return {
      ...rest,
      id: markerId(marker, dedupe),
    };
  });
}

export function buildRouteEndpointFeatureCollection(
  routes: PrismMapRoute[],
  options?: { dedupe?: boolean }
): RouteEndpointFeatureCollection {
  const features: RouteEndpointFeatureCollection["features"] =
    collectMapEndpointMarkers(routes, options).map((marker) => ({
      type: "Feature",
      id: marker.id,
      properties: {
        label: ROUTE_ENDPOINT_LABEL[marker.kind],
        fillColor: marker.fillColor,
        fillOpacity: marker.fillOpacity,
        stackOrder: marker.stackOrder,
      },
      geometry: {
        type: "Point",
        coordinates: [marker.position.lng, marker.position.lat],
      },
    }));

  return { type: "FeatureCollection", features };
}
