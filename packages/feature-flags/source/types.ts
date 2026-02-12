/**
 * FeatureFlags – shared evaluation context and config types
 */

/** VERCEL_ENV (production | preview | development) or NODE_ENV */
export interface FeatureFlagContext {
  env: string;
  /** Explicit env overrides: e.g. FEATURE_X from process.env */
  envFlags?: Record<string, string>;
  /** URL overrides from ?param=value (set by proxy from query string) */
  urlOverrides?: Record<string, string>;
  /** From cookies/auth */
  user?: {
    authenticated: boolean;
    id?: string;
    type?: "admin" | "viewer";
  };
}

/** Options for createIdentify() */
export interface CreateIdentifyOptions {
  /** Resolve user from cookies; if not provided, context.user is left unset */
  authCheck?: (cookies: {
    get: (name: string) => { value: string } | undefined;
  }) => Promise<FeatureFlagContext["user"]>;
  /** Env var keys to read into envFlags (e.g. ['FEATURE_IS_DEBUG']) */
  envFlagKeys?: string[];
  /** Env var prefix; all process.env keys starting with this are added to envFlags */
  envFlagPrefix?: string;
}

/** Config for createFlag() */
export interface CreateFlagConfig<T> {
  key: string;
  description?: string;
  defaultValue?: T;
  options?: Array<{ value: T; label?: string }>;
  origin?: string;
  identify: (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }) => Promise<FeatureFlagContext> | FeatureFlagContext;
  decide: (context: FeatureFlagContext) => T;
}

/** Config for getProxy() */
export interface ProxyConfig {
  /** Only forward params whose key starts with this prefix (e.g. 'flag_'); stored key is name without prefix */
  paramPrefix?: string;
  /** Only forward these param keys; no prefix stripping */
  allowedKeys?: string[];
}
