/**
 * Retry logic with exponential backoff
 * For handling transient failures in AI API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function hasStatus(e: unknown): e is { status: number } {
  return typeof e === "object" && e !== null && "status" in e;
}
function hasCode(e: unknown): e is { code: string } {
  return typeof e === "object" && e !== null && "code" in e;
}
function hasNameRetry(e: unknown): e is { name: string; isRetryable: boolean } {
  return (
    typeof e === "object" && e !== null && "name" in e && "isRetryable" in e
  );
}

export function isRetryableError(error: unknown): boolean {
  if (hasStatus(error)) {
    if (error.status === 429) return true;
    if (error.status >= 500 && error.status < 600) return true;
  }
  if (hasCode(error)) {
    if (
      error.code === "ECONNRESET" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED"
    )
      return true;
  }
  if (hasNameRetry(error) && error.name === "AISDKError" && error.isRetryable)
    return true;
  return false;
}

/**
 * Execute function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt);

      // Call retry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt + 1, error);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

/**
 * Get error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return "Unknown error";
}

/**
 * Check if error is a client error (4xx) that shouldn't be retried
 */
export function isClientError(error: unknown): boolean {
  return hasStatus(error) && error.status >= 400 && error.status < 500;
}

/**
 * Check if error is a server error (5xx) that should be retried
 */
export function isServerError(error: unknown): boolean {
  return hasStatus(error) && error.status >= 500 && error.status < 600;
}
