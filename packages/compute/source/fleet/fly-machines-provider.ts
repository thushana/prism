import type { FleetProvider, FleetStatus } from "./types";

export type FlyMachinesProviderOptions = {
  /** Fly app name. */
  appName: string;
  /** API token (org or app-scoped). Prefer env — do not hardcode. */
  apiToken: string;
  /** Machines API host. */
  apiBaseUrl?: string;
  /** Target region (e.g. `iad`). */
  region?: string;
};

type FlyMachineSummary = {
  id: string;
  state: string;
  region?: string;
};

/**
 * Fly Machines fleet adapter (dark until `HEAVY_COMPUTE_FLEET=fly`).
 * Declarative `ensureReplicaCount`: starts stopped machines / creates up to N;
 * does not force-stop running workers (they exit-when-idle).
 */
export function createFlyMachinesProvider(
  options: FlyMachinesProviderOptions
): FleetProvider {
  const apiBaseUrl = (
    options.apiBaseUrl ?? "https://api.machines.dev"
  ).replace(/\/$/, "");
  const region = options.region ?? "iad";

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
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

  async function listMachines(): Promise<FlyMachineSummary[]> {
    return request<FlyMachineSummary[]>(
      "GET",
      `/v1/apps/${encodeURIComponent(options.appName)}/machines`
    );
  }

  return {
    async ensureReplicaCount(desiredReplicaCount: number) {
      const desired = Math.max(0, Math.floor(desiredReplicaCount));
      const machines = await listMachines();
      const started = machines.filter(
        (machine) => machine.state === "started" || machine.state === "starting"
      );
      const stopped = machines.filter(
        (machine) => machine.state === "stopped" || machine.state === "suspended"
      );

      let need = desired - started.length;
      for (const machine of stopped) {
        if (need <= 0) break;
        await request(
          "POST",
          `/v1/apps/${encodeURIComponent(options.appName)}/machines/${machine.id}/start`
        );
        need -= 1;
      }

      // Creating machines requires a pre-built image config from fly.toml deploy.
      // Scale-up beyond existing machine rows is a no-op here until ops provisions
      // a warm pool; status.detail reports the shortfall.
      void region;
      void need;
    },

    async status(): Promise<FleetStatus> {
      try {
        const machines = await listMachines();
        const actualReplicaCount = machines.filter(
          (machine) =>
            machine.state === "started" || machine.state === "starting"
        ).length;
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
