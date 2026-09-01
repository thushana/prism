"use client";

import * as React from "react";
import { PrismTypography } from "@ui";
import {
  PrismMap,
  createFetchKeyGoogleMapsLoader,
  createFetchMapboxTokenLoader,
  PRISM_MAP_MAPBOX_STYLE_DEFAULT,
  type PrismMapRoute,
} from "@ui/map";

const googleLoader = createFetchKeyGoogleMapsLoader("/api/maps/key");
const mapboxTokenLoader = createFetchMapboxTokenLoader(
  "/api/maps/mapbox-token"
);

/** Two short encoded polylines for smoke-testing the map shell (Google polyline algorithm). */
const MOCK_ROUTES: PrismMapRoute[] = [
  {
    id: "a",
    encodedPolyline: "_p~iF~ps|U",
    strokeColor: "#0d9488",
    strokeOpacity: 0.35,
    strokeWeight: 4,
  },
  {
    id: "b",
    encodedPolyline: "_p~iF~ps|U_ulLnnqC",
    strokeColor: "#2563eb",
    strokeOpacity: 0.35,
    strokeWeight: 4,
  },
];

export function PrismMapDemo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 pb-16">
      <PrismTypography
        role="body"
        size="regular"
        color={{ semanticText: "muted" }}
        as="p"
      >
        Live journey pages embed{" "}
        <PrismTypography role="body" size="regular" as="span" font="mono">
          JourneyRoutesMap
        </PrismTypography>{" "}
        (SWR + sampling). Below: standalone{" "}
        <PrismTypography role="body" size="regular" as="span" font="mono">
          PrismMap
        </PrismTypography>{" "}
        with mock polylines. Requires{" "}
        <PrismTypography role="body" size="regular" as="span" font="mono">
          GOOGLE_MAPS_WEB_KEY
        </PrismTypography>{" "}
        /{" "}
        <PrismTypography role="body" size="regular" as="span" font="mono">
          MAPBOX_ACCESS_TOKEN
        </PrismTypography>{" "}
        for previews.
      </PrismTypography>

      <div>
        <PrismTypography role="title" size="small" as="h2" className="mb-4">
          Google (roadmap)
        </PrismTypography>
        <PrismMap
          vendor="google"
          loadGoogleMaps={googleLoader}
          routes={MOCK_ROUTES}
          shell="card"
          title="Mock routes"
          minHeightPx={360}
        />
      </div>

      <div>
        <PrismTypography role="title" size="small" as="h2" className="mb-4">
          Mapbox (light)
        </PrismTypography>
        <PrismMap
          vendor="mapbox"
          mapboxAccessToken={mapboxTokenLoader}
          mapbox={{ style: PRISM_MAP_MAPBOX_STYLE_DEFAULT }}
          routes={MOCK_ROUTES}
          shell="card"
          title="Mock routes"
          minHeightPx={360}
        />
      </div>
    </div>
  );
}
