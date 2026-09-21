/**
 * Load GSAP on demand so layout chrome (PrismButton, PrismIcon, PrismTypography)
 * does not put the animation runtime on every page's first-load JS.
 */

type GsapModule = typeof import("gsap");

let pending: Promise<GsapModule> | undefined;
let loaded: GsapModule | undefined;

export function loadGsap(): Promise<GsapModule> {
  pending ??= import("gsap").then((mod) => {
    loaded = mod;
    return mod;
  });
  return pending;
}

/** Sync access after {@link loadGsap} has resolved; otherwise `undefined`. */
export function getGsapIfLoaded(): GsapModule["gsap"] | undefined {
  return loaded?.gsap;
}

let splitPending: Promise<{
  gsap: GsapModule["gsap"];
  SplitText: typeof import("gsap/SplitText").SplitText;
}> | undefined;

export function loadGsapSplitText(): Promise<{
  gsap: GsapModule["gsap"];
  SplitText: typeof import("gsap/SplitText").SplitText;
}> {
  splitPending ??= (async () => {
    const gsapMod = await loadGsap();
    const { SplitText } = await import("gsap/SplitText");
    gsapMod.gsap.registerPlugin(SplitText);
    return { gsap: gsapMod.gsap, SplitText };
  })();
  return splitPending;
}
