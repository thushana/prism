/**
 * Decodes an [Encoded Polyline Algorithm Format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
 * string into latitude/longitude pairs (used by Google Directions and Mapbox `geometries=polyline`).
 */

export type LatLng = { lat: number; lng: number };

/**
 * @param encoded Encoded polyline string; empty string returns `[]`.
 */
export function decodeEncodedPolyline(encoded: string): LatLng[] {
  if (!encoded.length) return [];

  const path: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    path.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }

  return path;
}
