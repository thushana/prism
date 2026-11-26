export type DesiredReplicaCountPolicy = {
  /** Max replicas to start. */
  maxReplicaCount: number;
  /** Queued jobs per replica before adding another. */
  queuedJobsPerReplica: number;
};

export type DesiredReplicaCountInput = {
  queuedCount: number;
  runningCount: number;
  policy: DesiredReplicaCountPolicy;
};

/**
 * Pure scale helper: backlog → desired replica count.
 * When nothing is queued or running, returns 0 (workers should exit-when-idle).
 */
export function desiredReplicaCount(input: DesiredReplicaCountInput): number {
  const { queuedCount, runningCount, policy } = input;
  const queued = Math.max(0, queuedCount);
  const running = Math.max(0, runningCount);
  if (queued === 0 && running === 0) return 0;

  const perReplica = Math.max(1, policy.queuedJobsPerReplica);
  const maxReplicaCount = Math.max(0, policy.maxReplicaCount);
  const fromQueue = Math.ceil(queued / perReplica);
  // Keep at least one replica while work is still running even if queue is empty.
  const floor = running > 0 ? 1 : 0;
  return Math.min(maxReplicaCount, Math.max(floor, fromQueue));
}

/** Starting policy hosts may override. See COMPUTE-Prism.md. */
export const DEFAULT_HEAVY_REPLICA_POLICY: DesiredReplicaCountPolicy = {
  maxReplicaCount: 8,
  queuedJobsPerReplica: 10,
};
