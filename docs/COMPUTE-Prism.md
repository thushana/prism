# Compute (Prism)

Mental model for **`packages/compute`**: portable heavy-worker runtime + pluggable fleet. Host apps own the Postgres job queue and handlers. See City Observatory plan: `docs/plans/PLAN-compute-CityObservatory.md` in the consumer repo.

## What

| Piece | Role |
| --- | --- |
| `runWorkerLoop` | Idle backoff, once/limit, exit-when-idle around an app `tick` |
| `FleetProvider` | `ensureReplicaCount(n)` + `status()` — declarative scale |
| `desiredReplicaCount` | Pure backlog → N |
| Adapters | `localProvider` now; Fly / Cloud Run in the host or later package exports |

## What not

- Job table / claim SQL (app-owned; Neon HTTP constraints vary)
- PDF/image codecs (later optional media package)
- Provider billing UI

## Host pattern

1. Light kinds (crawl / sync) on Vercel cron.
2. Heavy kinds (`pdf.process`, `image.process`, `video.process`) on fleet workers when enabled.
3. Same queue; filter kinds per executor. Workers **exit when idle** (do not kill mid-lease).

## Identifiers

`ensureReplicaCount`, `desiredReplicaCount`, `queuedCount`, `runningCount`, `HEAVY_COMPUTE_FLEET`.
