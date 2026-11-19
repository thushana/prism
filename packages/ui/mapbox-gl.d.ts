/**
 * Ambient types when `mapbox-gl` is not installed (optional peer).
 * Apps that use Mapbox should depend on `mapbox-gl` for real types + runtime.
 */
declare module "mapbox-gl" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapboxgl: any;
  export default mapboxgl;
  export type StyleSpecification = Record<string, unknown>;
  export type ProjectionSpecification = Record<string, unknown>;
  /** Instance shape — avoid bare `any` so callback params stay contextually typed. */
  export interface Map {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(type: string, listener: (event: any) => void): unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type GeoJSONSource = any;
}
