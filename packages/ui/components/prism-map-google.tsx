"use client";

/**
 * Google Maps implementation for {@link PrismMap}.
 * Vendor-only options belong in `google.*` on the parent; this component only receives the merged result.
 *
 * Map bootstrap runs once; route updates patch existing {@link google.maps.Polyline} instances by `id`
 * and only re-`fitBounds` when encoded geometry changes (avoids full “redraw” on stroke-only updates).
 */

/// <reference types="google.maps" />

import { useEffect, useRef, useState } from "react";
import { decodeEncodedPolyline } from "../source/polyline-decode";
import {
  PRISM_MAP_GOOGLE_GRAYSCALE_STYLES,
  PRISM_MAP_GOOGLE_ROADMAP_BASE,
} from "./prism-map-styles";
import {
  ROUTE_ENDPOINT_LABEL,
  collectMapEndpointMarkers,
} from "./prism-map-endpoints";
import type { PrismMapRoute } from "./prism-map-types";

function googleEndpointMarkerIcon(
  color: string,
  opacity: number
): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 7,
    fillColor: color,
    fillOpacity: opacity,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

function padLatLngBounds(
  bounds: google.maps.LatLngBounds,
  fraction: number
): google.maps.LatLngBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const latSpan = ne.lat() - sw.lat();
  const lngSpan = ne.lng() - sw.lng();
  const padLat = latSpan * fraction;
  const padLng = lngSpan * fraction;
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(sw.lat() - padLat, sw.lng() - padLng),
    new google.maps.LatLng(ne.lat() + padLat, ne.lng() + padLng)
  );
}

function routesGeometrySignature(routes: PrismMapRoute[]): string {
  return routes.map((r) => `${r.id}\n${r.encodedPolyline}`).join("\u0001");
}

export type PrismMapGoogleProps = {
  routes: PrismMapRoute[];
  autoFit?: boolean;
  loadGoogleMaps: () => Promise<void>;
  mapOptions?: google.maps.MapOptions;
  styles?: google.maps.MapTypeStyle[];
  onRouteSelectionChange?: (route: PrismMapRoute | null) => void;
};

export function PrismMapGoogle({
  routes,
  autoFit = true,
  loadGoogleMaps,
  mapOptions,
  styles,
  onRouteSelectionChange,
}: PrismMapGoogleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineByRouteIdRef = useRef<Map<string, google.maps.Polyline>>(
    new Map()
  );
  const markerByKeyRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const routesByIdRef = useRef<Map<string, PrismMapRoute>>(new Map());
  const onRouteSelectionRef = useRef(onRouteSelectionChange);
  const lastGeometrySigRef = useRef<string>("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onRouteSelectionRef.current = onRouteSelectionChange;
  }, [onRouteSelectionChange]);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  // Bootstrap map once; do not depend on `routes` (hover restyles must not re-run this).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    void (async () => {
      try {
        setBootstrapError(null);
        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            ...PRISM_MAP_GOOGLE_ROADMAP_BASE,
            styles: styles ?? PRISM_MAP_GOOGLE_GRAYSCALE_STYLES,
            ...mapOptions,
          });
          mapRef.current.addListener("click", () => {
            onRouteSelectionRef.current?.(null);
          });
        } else {
          mapRef.current.setOptions({
            ...PRISM_MAP_GOOGLE_ROADMAP_BASE,
            styles: styles ?? PRISM_MAP_GOOGLE_GRAYSCALE_STYLES,
            ...mapOptions,
          });
        }

        setMapReady(true);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled || !mapRef.current) return;
            google.maps.event.trigger(mapRef.current, "resize");
          });
        });
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Google Maps failed to load";
          setBootstrapError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- read latest Maps at unmount (not DOM refs)
      const polys = polylineByRouteIdRef.current;
      polys.forEach((p) => p.setMap(null));
      polys.clear();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- read latest marker Map at unmount
      const markers = markerByKeyRef.current;
      markers.forEach((m) => m.setMap(null));
      markers.clear();
      lastGeometrySigRef.current = "";
      const map = mapRef.current;
      mapRef.current = null;
      if (map && typeof google !== "undefined" && google.maps?.event) {
        google.maps.event.clearInstanceListeners(map);
      }
      setMapReady(false);
    };
  }, [loadGoogleMaps, mapOptions, styles]);

  // Patch polylines in place; fit camera only when encoded paths change.
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    const polys = polylineByRouteIdRef.current;
    const markers = markerByKeyRef.current;
    const nextIds = new Set<string>();
    const nextMarkerKeys = new Set<string>();

    routesByIdRef.current.clear();
    for (const r of routes) {
      routesByIdRef.current.set(r.id, r);
    }

    for (const route of routes) {
      const path = decodeEncodedPolyline(route.encodedPolyline).map(
        ({ lat, lng }) => new google.maps.LatLng(lat, lng)
      );
      if (path.length === 0) continue;

      nextIds.add(route.id);
      let poly = polys.get(route.id);
      const z = route.stackOrder ?? 0;
      if (!poly) {
        poly = new google.maps.Polyline({
          path,
          strokeColor: route.strokeColor,
          strokeOpacity: route.strokeOpacity ?? 0.2,
          strokeWeight: route.strokeWeight ?? 3,
          geodesic: true,
          zIndex: z,
          clickable: true,
          map,
        });
        const routeId = route.id;
        poly.addListener("click", () => {
          const picked = routesByIdRef.current.get(routeId);
          if (picked) onRouteSelectionRef.current?.(picked);
        });
        polys.set(route.id, poly);
      } else {
        poly.setOptions({
          strokeColor: route.strokeColor,
          strokeOpacity: route.strokeOpacity ?? 0.2,
          strokeWeight: route.strokeWeight ?? 3,
          geodesic: true,
          zIndex: z,
        });
        const prevPath = poly.getPath();
        const sameLen = prevPath.getLength() === path.length;
        let samePoints = sameLen;
        if (sameLen) {
          for (let i = 0; i < path.length; i += 1) {
            const a = prevPath.getAt(i);
            const b = path[i]!;
            if (a.lat() !== b.lat() || a.lng() !== b.lng()) {
              samePoints = false;
              break;
            }
          }
        }
        if (!samePoints) {
          poly.setPath(path);
        }
      }
    }

    for (const endpoint of collectMapEndpointMarkers(routes)) {
      nextMarkerKeys.add(endpoint.id);
      let marker = markers.get(endpoint.id);
      const label = ROUTE_ENDPOINT_LABEL[endpoint.kind];
      const position = {
        lat: endpoint.position.lat,
        lng: endpoint.position.lng,
      };
      if (!marker) {
        marker = new google.maps.Marker({
          position,
          map,
          clickable: false,
          zIndex: endpoint.stackOrder,
          label: {
            text: label,
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700",
          },
          icon: googleEndpointMarkerIcon(
            endpoint.fillColor,
            endpoint.fillOpacity
          ),
        });
        markers.set(endpoint.id, marker);
      } else {
        marker.setPosition(position);
        marker.setOptions({
          zIndex: endpoint.stackOrder,
          label: {
            text: label,
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700",
          },
          icon: googleEndpointMarkerIcon(
            endpoint.fillColor,
            endpoint.fillOpacity
          ),
        });
      }
    }

    for (const [key, marker] of [...markers.entries()]) {
      if (!nextMarkerKeys.has(key)) {
        marker.setMap(null);
        markers.delete(key);
      }
    }

    for (const [id, poly] of [...polys.entries()]) {
      if (!nextIds.has(id)) {
        poly.setMap(null);
        polys.delete(id);
      }
    }

    if (routes.length === 0) {
      lastGeometrySigRef.current = "";
      return;
    }

    const geometrySig = routesGeometrySignature(routes);
    if (
      autoFit &&
      geometrySig.length > 0 &&
      geometrySig !== lastGeometrySigRef.current
    ) {
      lastGeometrySigRef.current = geometrySig;
      const bounds = new google.maps.LatLngBounds();
      for (const route of routes) {
        for (const pt of decodeEncodedPolyline(route.encodedPolyline)) {
          bounds.extend(new google.maps.LatLng(pt.lat, pt.lng));
        }
      }
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        const padded = padLatLngBounds(bounds, 0.15);
        map.setOptions({
          restriction: { latLngBounds: padded, strictBounds: false },
        });
      }
    }
  }, [routes, autoFit, mapReady]);

  return (
    <div className="relative h-full w-full min-h-0 flex-1">
      {bootstrapError ? (
        <div className="bg-destructive/10 text-destructive absolute inset-0 z-20 flex items-center justify-center p-4 text-center text-sm">
          {bootstrapError}
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full min-h-0" />
    </div>
  );
}
