/**
 * Ambient types when `maplibre-gl` is not installed (optional peer).
 * Apps that use MapLibre should depend on `maplibre-gl` for real types + runtime.
 */
declare module "maplibre-gl" {
  export type StyleSpecification = Record<string, unknown>;
  /** Instance shape — avoid bare `any` so callback params stay contextually typed. */
  export interface Map {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(type: string, listener: (event: any) => void): unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type GeoJSONSource = any;

  export class LngLatBounds {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extend(...args: any[]): this;
    isEmpty(): boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export class NavigationControl {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(options?: any);
  }

  // Constructor lives on the module namespace (`new maplibregl.Map(...)`).
  export const Map: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (options?: any): Map;
  };

  export function setWorkerUrl(url: string): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maplibregl: any;
  export default maplibregl;
}
