/// <reference types="google.maps" />

/**
 * Grayscale basemap: street + park labels only (no restaurants, stores, etc.).
 *
 * Reference palette for Cloud Console Map Styles — associate with
 * `GOOGLE_MAPS_MAP_ID`. Cannot be applied at runtime when a `mapId` is set
 * (Advanced Markers require `mapId`).
 */
export const PRISM_MAP_GOOGLE_GRAYSCALE_STYLES: google.maps.MapTypeStyle[] = [
  /** Desaturate the whole basemap. */
  { stylers: [{ saturation: -100 }] },
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e0e0e0" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },

  /** Hide every label / POI icon, then re-enable streets + parks only. */
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },

  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },

  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b6b6b" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];

/**
 * Default Map ID for {@link google.maps.marker.AdvancedMarkerElement}.
 * Override at runtime via {@link resolvePrismGoogleMapsMapId} (from the maps key endpoint).
 * Create a Cloud Map ID for production styling: https://developers.google.com/maps/documentation/javascript/map-ids
 */
export const PRISM_MAP_GOOGLE_MAP_ID = "DEMO_MAP_ID";

/** Default `Map` constructor options shared with {@link PRISM_MAP_GOOGLE_GRAYSCALE_STYLES}. */
export const PRISM_MAP_GOOGLE_ROADMAP_BASE: google.maps.MapOptions = {
  mapTypeId: "roadmap",
  disableDefaultUI: true,
  zoomControl: true,
  /** Re-enable after `disableDefaultUI` so users can leave north-up. */
  rotateControl: true,
  headingInteractionEnabled: true,
  tiltInteractionEnabled: true,
  gestureHandling: "greedy",
};

export const PRISM_MAP_MAPBOX_STYLE_DEFAULT =
  "mapbox://styles/mapbox/light-v11";
