/// <reference types="google.maps" />

export type GoogleAdvancedMarker = google.maps.marker.AdvancedMarkerElement;

export function createGoogleRouteEndpointPinContent(options: {
  label: string;
  fillColor: string;
  fillOpacity: number;
}): google.maps.marker.PinElement {
  const pin = new google.maps.marker.PinElement({
    background: options.fillColor,
    borderColor: "#ffffff",
    glyph: options.label,
    glyphColor: "#ffffff",
    scale: 0.85,
  });
  pin.style.opacity = String(options.fillOpacity);
  return pin;
}

export function createGoogleRouteEndpointMarker(options: {
  map: google.maps.Map;
  position: google.maps.LatLngLiteral;
  label: string;
  fillColor: string;
  fillOpacity: number;
  zIndex: number;
}): GoogleAdvancedMarker {
  const pin = createGoogleRouteEndpointPinContent(options);
  const marker = new google.maps.marker.AdvancedMarkerElement({
    map: options.map,
    position: options.position,
    zIndex: options.zIndex,
    gmpClickable: false,
  });
  marker.append(pin);
  return marker;
}

export function updateGoogleRouteEndpointMarker(
  marker: GoogleAdvancedMarker,
  options: {
    position: google.maps.LatLngLiteral;
    label: string;
    fillColor: string;
    fillOpacity: number;
    zIndex: number;
  }
): void {
  marker.position = options.position;
  marker.zIndex = options.zIndex;
  marker.replaceChildren(createGoogleRouteEndpointPinContent(options));
}

export function detachGoogleAdvancedMarker(marker: GoogleAdvancedMarker): void {
  marker.map = null;
}
