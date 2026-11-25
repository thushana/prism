export type FleetStatus = {
  desiredReplicaCount: number;
  actualReplicaCount: number;
  healthy: boolean;
  detail?: string;
};

export type EnsureReplicaCountResult = {
  /** Replicas running (or starting) after the call. */
  replicaCount: number;
  /** Desired minus replicas the provider could bring up; 0 when satisfied. */
  shortfall: number;
};

/**
 * Declarative fleet control. Hosts call `ensureReplicaCount`; workers exit
 * themselves when idle (no stop in the happy path).
 */
export type FleetProvider = {
  ensureReplicaCount: (
    desiredReplicaCount: number
  ) => Promise<EnsureReplicaCountResult>;
  status: () => Promise<FleetStatus>;
};
