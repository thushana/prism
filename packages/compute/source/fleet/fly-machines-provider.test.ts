import { describe, expect, it } from "vitest";
import { createFlyMachinesProvider } from "./fly-machines-provider";

type Call = { method: string; path: string; body?: unknown };

function fakeFly(machines: Array<Record<string, unknown>>) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? "GET";
    calls.push({
      method,
      path,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const json = method === "GET" ? machines : {};
    return new Response(JSON.stringify(json), { status: 200 });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
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
      "POST /v1/apps/app/machines",
    ]);
    expect(calls[2]?.body).toMatchObject({ config: { image: "x" } });
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

  it("never stops machines when desired is lower", async () => {
    const { calls, fetchImpl } = fakeFly([
      { id: "a", state: "started" },
      { id: "b", state: "started" },
    ]);
    const fleet = createFlyMachinesProvider({
      appName: "app",
      apiToken: "t",
      fetchImpl,
    });
    const result = await fleet.ensureReplicaCount(0);
    expect(result.shortfall).toBe(0);
    expect(calls).toHaveLength(1);
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
