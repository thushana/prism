import type {
  EnsureReplicaCountResult,
  FleetProvider,
  FleetStatus,
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
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
};

type FlyMachineSummary = {
  id: string;
  state: string;
  region?: string;
  config?: Record<string, unknown>;
};

function isRunning(machine: FlyMachineSummary): boolean {
  return machine.state === "started" || machine.state === "starting";
}

function isStopped(machine: FlyMachineSummary): boolean {
  return machine.state === "stopped" || machine.state === "suspended";
}

/**
 * Fly Machines fleet adapter (dark until the host enables it).
 *
 * `ensureReplicaCount` starts stopped machines, then clones the config of an
 * existing machine to reach N. It never stops running workers (they
 * exit-when-idle). An app with zero machines needs one seeded machine
 * (`fly machine run` / `fly deploy`); that case reports a full shortfall.
 */
export function createFlyMachinesProvider(
  options: FlyMachinesProviderOptions
): FleetProvider {
  const apiBaseUrl = (
    options.apiBaseUrl ?? "https://api.machines.dev"
  ).replace(/\/$/, "");
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

  const listMachines = () => request<FlyMachineSummary[]>("GET", appPath);

  return {
    async ensureReplicaCount(
      desiredReplicaCount: number
    ): Promise<EnsureReplicaCountResult> {
      const desired = Math.max(0, Math.floor(desiredReplicaCount));
      const machines = await listMachines();
      let replicaCount = machines.filter(isRunning).length;

      for (const machine of machines.filter(isStopped)) {
        if (replicaCount >= desired) break;
        await request("POST", `${appPath}/${machine.id}/start`);
        replicaCount += 1;
      }

      const template = machines.find((machine) => machine.config);
      while (replicaCount < desired && template?.config) {
        await request("POST", appPath, { config: template.config, region });
        replicaCount += 1;
      }

      return {
        replicaCount,
        shortfall: Math.max(0, desired - replicaCount),
      };
    },

    async status(): Promise<FleetStatus> {
      try {
        const machines = await listMachines();
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
  };
}
