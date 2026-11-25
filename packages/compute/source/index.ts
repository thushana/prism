export {
  createFlyMachinesProvider,
  createLocalProvider,
  type EnsureReplicaCountResult,
  type FleetMachineRef,
  type FleetProvider,
  type FleetStatus,
  type FlyMachinesProviderOptions,
  type StopMachineOptions,
} from "./fleet";
export {
  DEFAULT_HEAVY_REPLICA_POLICY,
  desiredReplicaCount,
  type DesiredReplicaCountInput,
  type DesiredReplicaCountPolicy,
} from "./scale";
export {
  runWorkerLoop,
  type RunWorkerLoopOptions,
  type RunWorkerLoopResult,
  type WorkerTick,
} from "./worker";
