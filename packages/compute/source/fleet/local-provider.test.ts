import { describe, expect, it } from "vitest";
import { createLocalProvider } from "./local-provider";

describe("createLocalProvider", () => {
  it("tracks desired replica count", async () => {
    const fleet = createLocalProvider();
    await fleet.ensureReplicaCount(4);
    const status = await fleet.status();
    expect(status.desiredReplicaCount).toBe(4);
    expect(status.actualReplicaCount).toBe(4);
    expect(status.healthy).toBe(true);
  });
});
