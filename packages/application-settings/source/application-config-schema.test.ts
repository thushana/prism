import { describe, expect, it } from "vitest";
import { applicationConfigBaseSchema } from "./application-config-schema";

describe("applicationConfigBaseSchema", () => {
  it("accepts an empty object", () => {
    const result = applicationConfigBaseSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
