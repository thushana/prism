/**
 * In-memory rate limiting for authentication endpoints.
 * Best-effort per serverless instance; combine with edge WAF for production hardening.
 */

export type RateLimitOptions = {
  maxAttempts: number;
  windowMs: number;
};

/** Failed/successful login attempts per client IP */
export const RATE_LIMIT_WEB_LOGIN: RateLimitOptions = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

/** API key checks per client IP */
export const RATE_LIMIT_API: RateLimitOptions = {
  maxAttempts: 120,
  windowMs: 60 * 1000,
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function pruneExpiredBuckets(now: number): void {
  if (buckets.size < 5000) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

/**
 * Resolve client IP from common proxy headers (Vercel, etc.).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Enforce a sliding-window attempt limit for the given key.
 * @throws Response with 429 when the limit is exceeded
 */
export function enforceRateLimit(key: string, options: RateLimitOptions): void {
  const now = Date.now();
  pruneExpiredBuckets(now);

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > options.maxAttempts) {
    throw new Response("Too Many Requests", { status: 429 });
  }
}

/** @internal Clears in-memory buckets between tests */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
