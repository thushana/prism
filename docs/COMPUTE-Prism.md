# Compute (Prism)

Mental model for **`packages/compute`**: portable heavy-worker runtime and pluggable fleet scale. Host apps own the Postgres job queue, handlers, and when (or whether) a fleet runs.

Sources of truth for behavior:

- [`source/worker/run-worker-loop.ts`](../packages/compute/source/worker/run-worker-loop.ts)
- [`source/scale/desired-replica-count.ts`](../packages/compute/source/scale/desired-replica-count.ts)
- [`source/fleet/types.ts`](../packages/compute/source/fleet/types.ts)
- [`source/fleet/fly-machines-provider.ts`](../packages/compute/source/fleet/fly-machines-provider.ts)
- [`source/fleet/local-provider.ts`](../packages/compute/source/fleet/local-provider.ts)

## What

| Piece | Role |
| --- | --- |
| `runWorkerLoop` | Idle backoff, once/limit, exit-when-idle around an app-supplied `tick` |
| `FleetProvider` | `ensureReplicaCount(n)` + `status()` — declarative scale |
| `desiredReplicaCount` | Pure backlog → N |
| `createLocalProvider` | In-process / test fleet |
| `createFlyMachinesProvider` | Fly Machines adapter (start / create / stop-at-zero) |
| Optional `listMachines` / `stopMachine` | Hosts that reap a stale machine while work is still running |

## What this package does not own

- The Postgres job table, claim SQL, or attempt accounting
- PDF, image, or video codecs
- Provider billing
- The host’s Dockerfile, image publish workflow, wake cron, heartbeat table, wall-clock lifetime, or fetch limiter

## Host pattern

1. Light kinds (crawl / sync) stay on the host cron. Heavy kinds use shared names `pdf.process`, `image.process`, and `video.process` when a fleet is enabled. The package does not register kinds.
2. One queue. Each process filters kinds. Workers **exit when idle** (happy-path scale-down).
3. Fleet off means the host cron drains every kind. That path must keep working.
4. When the fleet is on and unreachable, the host cron may drain heavy kinds on that tick (**fail open**). A partial fleet stays fleet-owned.

Those last two are host behavior the package is designed for (see a consumer’s `cronKindsForFleetMode`-style helper). They are not package exports.

## Scale contract

Verified in `desiredReplicaCount` and `createFlyMachinesProvider`:

- `desiredReplicaCount` returns **0** when queued and running are both 0. It returns **at least 1** while anything is running, even if the queue is empty, so a busy tail is not treated as idle.
- Happy-path scale-down is the **worker exiting**. Dark Machines use `restart = never`.
- `ensureReplicaCount(0)` **stops** machines that are still started. That is the zombie backstop when a process did not exit after the queue drained.
- `ensureReplicaCount(n)` for `n > 0` starts or creates until N. It does **not** stop a started machine that exceeds N (that would kill workers that still hold a job).
- An app with **zero** machines cannot be scaled by the adapter. The host seeds one stopped machine; the adapter reports the shortfall.
- SIGTERM / abort of an in-flight claim (reschedule, no attempt spent) is **host** behavior (CLI + job engine). A hard kill uses the host’s lease reclaim.

`DEFAULT_HEAVY_REPLICA_POLICY` (`maxReplicaCount: 8`, `queuedJobsPerReplica: 10`) is a starting policy. Hosts may override.

## What the host keeps

Queue, kind handlers, ObjectStore, caps, domain ids. Dockerfile and image publish (path filters, a periodic republish so a missed path cannot lag forever, skip publish while a machine is inside its max lifetime). Wake cron. Optional heartbeat rows and wall-clock lifetime. Document those in the **host’s worker runbook**, not here.

## Later

- A Cloud Run adapter is not implemented. Add it only when a second host is required, against the same `FleetProvider` behavior.
- A media package (bytes in → derivatives out, optional native peers) waits until a second app needs it. Handlers in the app stay the ones that enqueue and store.
- Do not move a generic `jobs` schema into Prism.
