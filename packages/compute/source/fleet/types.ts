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

export type FleetMachineRef = {
  id: string;
  state: string;
};

export type StopMachineOptions = {
  signal?: "SIGTERM" | "SIGINT" | "SIGKILL";
  timeout?: string;
};

/**
 * Declarative fleet control. Hosts call `ensureReplicaCount`; workers exit
 * themselves when idle (happy path). Optional list/stop support stale-machine
 * reap while desired > 0.
 */
export type FleetProvider = {
  ensureReplicaCount: (
    desiredReplicaCount: number
  ) => Promise<EnsureReplicaCountResult>;
  status: () => Promise<FleetStatus>;
  /** List machine id+state (Fly). Optional on noop/local providers. */
  listMachines?: () => Promise<FleetMachineRef[]>;
  /** Stop one machine (Fly). Optional on noop/local providers. */
  stopMachine?: (
    machineId: string,
    options?: StopMachineOptions
  ) => Promise<void>;
};
