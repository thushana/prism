import { describe, expect, it, vi } from "vitest";
import { runWorkerLoop } from "./run-worker-loop";

describe("runWorkerLoop", () => {
  it("stops on once when a tick runs nothing", async () => {
    const tick = vi.fn(async () => ({ ranCount: 0 }));
    const result = await runWorkerLoop({ tick, once: true, limit: 5 });
    expect(result.stoppedReason).toBe("once");
    expect(result.ticks).toBe(1);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it("respects limit when work keeps arriving", async () => {
    const tick = vi.fn(async () => ({ ranCount: 2 }));
    const result = await runWorkerLoop({ tick, once: true, limit: 3 });
    expect(result.stoppedReason).toBe("limit");
    expect(result.ticks).toBe(3);
    expect(result.totalRan).toBe(6);
  });

  it("exits after consecutive idle ticks", async () => {
    const tick = vi.fn(async () => ({ ranCount: 0 }));
    const result = await runWorkerLoop({
      tick,
      exitAfterIdleTicks: 2,
      idleBackoffMs: 1,
      idleBackoffMaxMs: 1,
    });
    expect(result.stoppedReason).toBe("idle");
    expect(result.ticks).toBe(2);
  });

  it("stops when aborted", async () => {
    const controller = new AbortController();
    let calls = 0;
    const tick = vi.fn(async () => {
      calls += 1;
      if (calls === 1) controller.abort();
      return { ranCount: 1 };
    });
    const result = await runWorkerLoop({
      tick,
      signal: controller.signal,
      idleBackoffMs: 1,
    });
    expect(result.stoppedReason).toBe("aborted");
  });
});
