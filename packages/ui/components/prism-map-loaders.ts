/**
 * Loads the Google Maps JS API after resolving an API key from JSON (`{ apiKey }`).
 * Idempotent: repeated calls await the same in-flight promise until `google.maps.Map` exists.
 *
 * Readiness uses only `google.maps.Map` — not `geometry.encoding`. Prism decodes polylines locally
 * (`decodeEncodedPolyline`); waiting on `geometry.encoding` breaks with `loading=async` and can
 * deadlock if a Prism-tagged script already fired `load` before this code subscribed.
 */

function isGoogleMapsMapReady(): boolean {
  return Boolean(window.google?.maps?.Map);
}

async function waitForGoogleMapsMapReady(): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (isGoogleMapsMapReady()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Google Maps API did not become ready in time");
}

export function createFetchKeyGoogleMapsLoader(
  apiKeyUrl: string
): () => Promise<void> {
  let loadPromise: Promise<void> | null = null;

  return () => {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("Google Maps loader requires a browser"));
    }
    if (isGoogleMapsMapReady()) {
      return Promise.resolve();
    }
    if (!loadPromise) {
      loadPromise = (async () => {
        try {
          const res = await fetch(apiKeyUrl);
          if (!res.ok) {
            throw new Error(`Google Maps key fetch failed: ${res.status}`);
          }
          const data = (await res.json()) as { apiKey?: string };
          if (!data.apiKey) {
            throw new Error("Google Maps key response missing apiKey");
          }
          const apiKey = data.apiKey;

          if (isGoogleMapsMapReady()) return;

          const anyExisting = document.querySelector<HTMLScriptElement>(
            'script[src*="maps.googleapis.com/maps/api/js"]'
          );
          if (anyExisting) {
            await waitForGoogleMapsMapReady();
            return;
          }

          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.dataset.prismGoogleMaps = "1";
            script.async = true;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&loading=async`;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Google Maps script failed"));
            document.head.appendChild(script);
          });

          await waitForGoogleMapsMapReady();
        } catch (error) {
          // Allow retry after transient failure (network, key endpoint, script load).
          loadPromise = null;
          throw error;
        }
      })();
    }
    return loadPromise;
  };
}

/**
 * Fetches a Mapbox access token from JSON (`{ accessToken }`). The returned function is cached per URL.
 * Mapbox GL JS itself is loaded separately (e.g. dynamic `import("mapbox-gl")`).
 */
export function createFetchMapboxTokenLoader(
  tokenUrl: string
): () => Promise<string> {
  let tokenPromise: Promise<string> | null = null;

  return () => {
    if (!tokenPromise) {
      tokenPromise = (async () => {
        try {
          const res = await fetch(tokenUrl);
          if (!res.ok) {
            throw new Error(`Mapbox token fetch failed: ${res.status}`);
          }
          const data = (await res.json()) as { accessToken?: string };
          if (!data.accessToken) {
            throw new Error("Mapbox token response missing accessToken");
          }
          return data.accessToken;
        } catch (error) {
          // Allow retry after transient failure.
          tokenPromise = null;
          throw error;
        }
      })();
    }
    return tokenPromise;
  };
}
