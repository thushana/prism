/** One drain pass supplied by the host app (e.g. `runTick`). */
export type WorkerTick = (signal: AbortSignal) => Promise<{
  /** How many jobs this tick claimed/ran. Zero means the queue looked idle. */
  ranCount: number;
}>;

export type RunWorkerLoopOptions = {
  tick: WorkerTick;
  signal?: AbortSignal;
  /** Process until idle or `limit` ticks, then return. */
  once?: boolean;
  /** Max ticks when `once` is true. */
  limit?: number;
  /** Initial idle sleep after an empty tick (ms). */
  idleBackoffMs?: number;
  /** Cap on idle sleep (ms). */
  idleBackoffMaxMs?: number;
  /**
   * Exit the loop after this many consecutive empty ticks (exit-when-idle).
   * Omit to poll forever (until `signal` aborts). Prefer set for fleet workers.
   */
  exitAfterIdleTicks?: number;
};

export type RunWorkerLoopResult = {
  ticks: number;
  totalRan: number;
  stoppedReason: "once" | "idle" | "aborted" | "limit";
};
