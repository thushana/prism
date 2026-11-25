import { describe, expect, it } from "vitest";
import { createFlyMachinesProvider } from "./fly-machines-provider";

type Call = { method: string; path: string; body?: unknown };

function fakeFly(
  initial: Array<Record<string, unknown>>,
  options: { onCreate?: () => void } = {}
) {
  let machines = [...initial];
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname + new URL(url).search;
    const method = init?.method ?? "GET";
    calls.push({
      method,
      path,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });

    if (method === "GET") {
      return new Response(JSON.stringify(machines), { status: 200 });
    }
    if (method === "POST" && path.endsWith("/machines")) {
      options.onCreate?.();
      const id = `new-${machines.length + 1}`;
      machines = [
        ...machines,
        { id, state: "started", config: { image: "x" } },
      ];
      return new Response(JSON.stringify({ id }), { status: 200 });
    }
    if (method === "POST" && path.includes("/start")) {
      const id = path.split("/").at(-2)!;
      machines = machines.map((machine) =>
        machine.id === id ? { ...machine, state: "started" } : machine
      );
      return new Response("{}", { status: 200 });
    }
    if (method === "POST" && path.includes("/stop")) {
      const id = path.split("/").at(-2)!;
      machines = machines.map((machine) =>
        machine.id === id ? { ...machine, state: "stopped" } : machine
      );
      return new Response("{}", { status: 200 });
    }
    if (method === "DELETE") {
      const id = path.split("/").at(-1)!.split("?")[0]!;
      machines = machines.filter((machine) => machine.id !== id);
      return new Response(null, { status: 204 });
    }
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl, getMachines: () => machines };
}

describe("createFlyMachinesProvider", () => {
  it("starts stopped machines before creating new ones", async () => {
    const { calls, fetchImpl } = fakeFly([
      { id: "a", state: "started", config: { image: "x" } },
      { id: "b", state: "stopped", config: { image: "x" } },
    ]);
    const fleet = createFlyMachinesProvider({
      appName: "app",
      apiToken: "t",
      fetchImpl,
    });
    const result = await fleet.ensureReplicaCount(3);
    expect(result).toEqual({ replicaCount: 3, shortfall: 0 });
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      "GET /v1/apps/app/machines",
      "POST /v1/apps/app/machines/b/start",
      "GET /v1/apps/app/machines",
      "POST /v1/apps/app/machines",
      "GET /v1/apps/app/machines",
      "GET /v1/apps/app/machines",
    ]);
    expect(calls.find((call) => call.method === "POST" && call.body)?.body).toMatchObject({
      config: { image: "x" },
    });
  });

  it("reports a full shortfall when no machine exists to clone", async () => {
    const { fetchImpl } = fakeFly([]);
    const fleet = createFlyMachinesProvider({
      appName: "app",
      apiToken: "t",
      fetchImpl,
    });
    expect(await fleet.ensureReplicaCount(2)).toEqual({
      replicaCount: 0,
      shortfall: 2,
    });
  });

  it("stops all started machines when desired is zero", async () => {
    const { calls, fetchImpl, getMachines } = fakeFly([
      { id: "a", state: "started" },
      { id: "b", state: "started" },
    ]);
    const fleet = createFlyMachinesProvider({
      appName: "app",
      apiToken: "t",
      fetchImpl,
    });
    const result = await fleet.ensureReplicaCount(0);
    expect(result).toEqual({ replicaCount: 0, shortfall: 0 });
    expect(getMachines().every((machine) => machine.state === "stopped")).toBe(
      true
    );
    const stops = calls.filter(
      (call) => call.method === "POST" && call.path.includes("/stop")
    );
    expect(stops).toHaveLength(2);
    expect(stops[0]?.body).toEqual({ signal: "SIGTERM", timeout: "15s" });
  });

  it("does not stop started machines when desired is positive", async () => {
    const { calls, fetchImpl } = fakeFly([
      { id: "a", state: "started" },
      { id: "b", state: "started" },
      { id: "c", state: "started" },
      { id: "d", state: "started" },
      { id: "e", state: "started" },
    ]);
    const fleet = createFlyMachinesProvider({
      appName: "app",
      apiToken: "t",
      fetchImpl,
    });
    const result = await fleet.ensureReplicaCount(1);
    expect(result).toEqual({ replicaCount: 5, shortfall: 0 });
    expect(
      calls.filter(
        (call) => call.method === "POST" && call.path.includes("/stop")
      )
    ).toHaveLength(0);
  });

  it("never creates past maxMachineCount and prunes excess stopped", async () => {
    const { calls, fetchImpl, getMachines } = fakeFly([
      { id: "a", state: "started", config: { image: "x" } },
      { id: "b", state: "stopped", config: { image: "x" } },
      { id: "c", state: "stopped", config: { image: "x" } },
      { id: "d", state: "stopped", config: { image: "x" } },
    ]);
    const fleet = createFlyMachinesProvider({
      appName: "app",
      apiToken: "t",
      maxMachineCount: 2,
      fetchImpl,
    });
    const result = await fleet.ensureReplicaCount(2);
    expect(result).toEqual({ replicaCount: 2, shortfall: 0 });
    expect(getMachines()).toHaveLength(2);
    expect(
      calls.some(
        (call) =>
          call.method === "DELETE" &&
          call.path.includes("/machines/") &&
          call.path.includes("force=true")
      )
    ).toBe(true);
    expect(
      calls.filter(
        (call) => call.method === "POST" && call.path.endsWith("/machines")
      )
    ).toHaveLength(0);
  });

  it("re-lists before each create so concurrent wakes cannot overshoot", async () => {
    let createCount = 0;
    const { calls, fetchImpl } = fakeFly(
      [{ id: "a", state: "started", config: { image: "x" } }],
      {
        onCreate: () => {
          createCount += 1;
        },
      }
    );
    const fleet = createFlyMachinesProvider({
      appName: "app",
      apiToken: "t",
      maxMachineCount: 2,
      fetchImpl,
    });
    await fleet.ensureReplicaCount(8);
    expect(createCount).toBe(1);
    expect(
      calls.filter(
        (call) => call.method === "POST" && call.path.endsWith("/machines")
      )
    ).toHaveLength(1);
  });

  it("reports unhealthy status when the API fails", async () => {
    const fleet = createFlyMachinesProvider({
      appName: "app",
      apiToken: "t",
      fetchImpl: (async () =>
        new Response("nope", { status: 401 })) as unknown as typeof fetch,
    });
    const status = await fleet.status();
    expect(status.healthy).toBe(false);
  });
});
