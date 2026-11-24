export type FleetStatus = {
  desiredReplicaCount: number;
  actualReplicaCount: number;
  healthy: boolean;
  detail?: string;
};

/**
 * Declarative fleet control. Hosts call `ensureReplicaCount`; workers exit
 * themselves when idle (no stop in the happy path).
 */
export type FleetProvider = {
  ensureReplicaCount: (desiredReplicaCount: number) => Promise<void>;
  status: () => Promise<FleetStatus>;
};
