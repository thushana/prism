import type {
  EnsureReplicaCountResult,
  FleetMachineRef,
  FleetProvider,
  FleetStatus,
  StopMachineOptions,
} from "./types";

export type FlyMachinesProviderOptions = {
  /** Fly app name. */
  appName: string;
  /** API token (org or app-scoped). Prefer env — do not hardcode. */
  apiToken: string;
  /** Machines API host. */
  apiBaseUrl?: string;
  /** Target region for newly created machines (e.g. `iad`). */
  region?: string;
  /**
   * Hard cap on machine records in the app. Creates never push past this;
   * excess stopped machines are pruned down to it. Defaults to the desired
   * count for each ensure call (no warm pool above desired).
   */
  maxMachineCount?: number;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
};

type FlyMachineSummary = {
  id: string;
  state: string;
  region?: string;
  updated_at?: string;
  config?: Record<string, unknown>;
};

function isRunning(machine: FlyMachineSummary): boolean {
  // `stopping` is in-flight SIGTERM — do not count toward desired or stale-start.
  return machine.state === "started" || machine.state === "starting";
}

function parseUpdatedAt(raw: string | undefined): Date | undefined {
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isStopped(machine: FlyMachineSummary): boolean {
  return machine.state === "stopped" || machine.state === "suspended";
}

/**
 * Fly Machines fleet adapter (dark until the host enables it).
 *
 * `ensureReplicaCount` starts stopped machines, then clones the config of an
 * existing machine to reach N. Happy-path scale-down is worker exit-when-idle.
 * When `desired === 0` (empty backlog), it stops any still-started machines as
 * a zombie backstop (SIGTERM → timeout). It does **not** stop when
 * `desired > 0` even if more machines are started than desired — that would
 * kill busy tail workers while jobs are still running.
 *
 * An app with zero machines needs one seeded machine (`fly machine run` /
 * `fly deploy`); that case reports a full shortfall. Concurrent wakes re-list
 * before every create and never exceed `maxMachineCount`.
 */
export function createFlyMachinesProvider(
  options: FlyMachinesProviderOptions
): FleetProvider {
  const apiBaseUrl = (options.apiBaseUrl ?? "https://api.machines.dev").replace(
    /\/$/,
    ""
  );
  const region = options.region ?? "iad";
  const doFetch = options.fetchImpl ?? fetch;
  const appPath = `/v1/apps/${encodeURIComponent(options.appName)}/machines`;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await doFetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${options.apiToken}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Fly Machines API ${method} ${path} failed: ${response.status} ${text}`
      );
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const fetchMachineList = () => request<FlyMachineSummary[]>("GET", appPath);

  async function pruneExcessStopped(
    machines: FlyMachineSummary[],
    maxMachineCount: number
  ): Promise<FlyMachineSummary[]> {
    let current = machines;
    while (current.length > maxMachineCount) {
      const victim = current.find(isStopped);
      if (!victim) break;
      await request(
        "DELETE",
        `${appPath}/${encodeURIComponent(victim.id)}?force=true`
      );
      current = await fetchMachineList();
    }
    return current;
  }

  return {
    async ensureReplicaCount(
      desiredReplicaCount: number
    ): Promise<EnsureReplicaCountResult> {
      const desired = Math.max(0, Math.floor(desiredReplicaCount));
      const maxMachineCount = Math.max(
        1,
        Math.floor(options.maxMachineCount ?? Math.max(desired, 1))
      );

      let machines = await pruneExcessStopped(
        await fetchMachineList(),
        maxMachineCount
      );

      // Zombie reap: empty backlog ⇒ stop every started/starting machine.
      // Do not stop when desired > 0 (busy tail workers must survive).
      if (desired === 0) {
        for (const machine of machines.filter(isRunning)) {
          await request("POST", `${appPath}/${machine.id}/stop`, {
            signal: "SIGTERM",
            timeout: "15s",
          });
        }
        machines = await fetchMachineList();
        const replicaCount = machines.filter(isRunning).length;
        return {
          replicaCount,
          shortfall: 0,
        };
      }

      let replicaCount = machines.filter(isRunning).length;

      for (const machine of machines.filter(isStopped)) {
        if (replicaCount >= desired) break;
        await request("POST", `${appPath}/${machine.id}/start`);
        replicaCount += 1;
      }

      while (replicaCount < desired) {
        machines = await fetchMachineList();
        replicaCount = machines.filter(isRunning).length;
        if (replicaCount >= desired) break;

        const stopped = machines.find(isStopped);
        if (stopped) {
          await request("POST", `${appPath}/${stopped.id}/start`);
          replicaCount += 1;
          continue;
        }

        if (machines.length >= maxMachineCount) break;

        const template = machines.find((machine) => machine.config);
        if (!template?.config) break;

        await request("POST", appPath, {
          config: template.config,
          region,
        });
        // Trust the next list, not an optimistic +1 (API lag / concurrent create).
        machines = await fetchMachineList();
        replicaCount = machines.filter(isRunning).length;
      }

      machines = await fetchMachineList();
      replicaCount = machines.filter(isRunning).length;
      return {
        replicaCount,
        shortfall: Math.max(0, desired - replicaCount),
      };
    },

    async status(): Promise<FleetStatus> {
      try {
        const machines = await fetchMachineList();
        const actualReplicaCount = machines.filter(isRunning).length;
        return {
          desiredReplicaCount: actualReplicaCount,
          actualReplicaCount,
          healthy: true,
          detail: `${machines.length} machine(s) in app ${options.appName}`,
        };
      } catch (error) {
        return {
          desiredReplicaCount: 0,
          actualReplicaCount: 0,
          healthy: false,
          detail: error instanceof Error ? error.message : String(error),
        };
      }
    },

    async listMachines(): Promise<FleetMachineRef[]> {
      const machines = await fetchMachineList();
      return machines.map((machine) => ({
        id: machine.id,
        state: machine.state,
        updatedAt: parseUpdatedAt(machine.updated_at),
      }));
    },

    async stopMachine(
      machineId: string,
      stopOptions: StopMachineOptions = {}
    ): Promise<void> {
      await request(
        "POST",
        `${appPath}/${encodeURIComponent(machineId)}/stop`,
        {
          signal: stopOptions.signal ?? "SIGTERM",
          timeout: stopOptions.timeout ?? "15s",
        }
      );
    },
  };
}
