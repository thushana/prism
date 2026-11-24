import type { RunWorkerLoopOptions, RunWorkerLoopResult } from "./types";

const DEFAULT_IDLE_BACKOFF_MS = 1_000;
const DEFAULT_IDLE_BACKOFF_MAX_MS = 30_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

/**
 * Portable worker loop around an app-supplied `tick`.
 * Host owns claim/complete; this owns idle backoff, once/limit, exit-when-idle.
 */
export async function runWorkerLoop(
  options: RunWorkerLoopOptions
): Promise<RunWorkerLoopResult> {
  const {
    tick,
    signal,
    once = false,
    limit = 10,
    idleBackoffMs = DEFAULT_IDLE_BACKOFF_MS,
    idleBackoffMaxMs = DEFAULT_IDLE_BACKOFF_MAX_MS,
    exitAfterIdleTicks,
  } = options;

  let ticks = 0;
  let totalRan = 0;
  let idleTicks = 0;
  let backoff = idleBackoffMs;
  const maxTicks = once ? Math.max(1, limit) : Number.POSITIVE_INFINITY;

  while (!signal?.aborted && ticks < maxTicks) {
    const result = await tick(signal ?? new AbortController().signal);
    ticks += 1;
    totalRan += result.ranCount;

    if (result.ranCount > 0) {
      idleTicks = 0;
      backoff = idleBackoffMs;
      if (once && ticks >= maxTicks) {
        return { ticks, totalRan, stoppedReason: "limit" };
      }
      continue;
    }

    idleTicks += 1;
    if (once) {
      return { ticks, totalRan, stoppedReason: "once" };
    }
    if (
      exitAfterIdleTicks != null &&
      idleTicks >= Math.max(1, exitAfterIdleTicks)
    ) {
      return { ticks, totalRan, stoppedReason: "idle" };
    }

    await sleep(backoff, signal);
    backoff = Math.min(backoff * 2, idleBackoffMaxMs);
  }

  return {
    ticks,
    totalRan,
    stoppedReason: signal?.aborted ? "aborted" : "limit",
  };
}
