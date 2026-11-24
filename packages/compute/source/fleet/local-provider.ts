import type { FleetProvider, FleetStatus } from "./types";

/**
 * In-process / test fleet: records desired count, reports it as actual.
 */
export function createLocalProvider(): FleetProvider & {
  getDesiredReplicaCount: () => number;
} {
  let desiredReplicaCount = 0;

  return {
    getDesiredReplicaCount: () => desiredReplicaCount,
    async ensureReplicaCount(nextDesired: number) {
      desiredReplicaCount = Math.max(0, Math.floor(nextDesired));
    },
    async status(): Promise<FleetStatus> {
      return {
        desiredReplicaCount,
        actualReplicaCount: desiredReplicaCount,
        healthy: true,
      };
    },
  };
}
