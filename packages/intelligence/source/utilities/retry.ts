/**
 * Retry logic with exponential backoff
 * For handling transient failures in AI API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, error: any) => void;
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
export function isRetryableError(error: any): boolean {
  // Rate limit errors
  if (error.status === 429) return true;

  // Server errors (5xx)
  if (error.status >= 500 && error.status < 600) return true;

  // Network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") return true;
  if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") return true;

  // AI SDK specific errors
  if (error.name === "AISDKError" && error.isRetryable) return true;

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

  let lastError: any;

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
export function getErrorMessage(error: any): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error?.message) {
    return error.message;
  }

  return "Unknown error";
}

/**
 * Check if error is a client error (4xx) that shouldn't be retried
 */
export function isClientError(error: any): boolean {
  return error.status >= 400 && error.status < 500;
}

/**
 * Check if error is a server error (5xx) that should be retried
 */
export function isServerError(error: any): boolean {
  return error.status >= 500 && error.status < 600;
}
