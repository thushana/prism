import { describe, expect, it } from "vitest";
import {
  DEFAULT_HEAVY_REPLICA_POLICY,
  desiredReplicaCount,
} from "./desired-replica-count";

describe("desiredReplicaCount", () => {
  it("returns 0 when the queue is idle", () => {
    expect(
      desiredReplicaCount({
        queuedCount: 0,
        runningCount: 0,
        policy: DEFAULT_HEAVY_REPLICA_POLICY,
      })
    ).toBe(0);
  });

  it("keeps one replica while work is still running", () => {
    expect(
      desiredReplicaCount({
        queuedCount: 0,
        runningCount: 2,
        policy: DEFAULT_HEAVY_REPLICA_POLICY,
      })
    ).toBe(1);
  });

  it("scales with queued depth and caps at max", () => {
    expect(
      desiredReplicaCount({
        queuedCount: 25,
        runningCount: 0,
        policy: DEFAULT_HEAVY_REPLICA_POLICY,
      })
    ).toBe(3);
    expect(
      desiredReplicaCount({
        queuedCount: 500,
        runningCount: 0,
        policy: DEFAULT_HEAVY_REPLICA_POLICY,
      })
    ).toBe(8);
  });
});
