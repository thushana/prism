import { describe, expect, it } from "vitest";
import { prismConfigBaseSchema } from "./prism-config-schema";

describe("prismConfigBaseSchema", () => {
  it("accepts app + deployments", () => {
    const result = prismConfigBaseSchema.safeParse({
      app: {
        displayName: "Test",
        description: "Test app",
        icon: "layers",
      },
      deployments: { dev: { port: 1776 } },
    });
    expect(result.success).toBe(true);
  });

  it("requires app section", () => {
    const result = prismConfigBaseSchema.safeParse({
      deployments: { dev: { port: 1776 } },
    });
    expect(result.success).toBe(false);
  });
});
