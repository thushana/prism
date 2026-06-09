import { describe, expect, it } from "vitest";
import { filterDependencyNamesForBuildOutput } from "./sync-dependency-allowlist";

describe("filterDependencyNamesForBuildOutput", () => {
  const runtime = [
    "next",
    "react",
    "react-dom",
    "drizzle-orm",
    "flags",
    "zod",
  ] as const;

  it("filters server-only packages for static build", () => {
    expect(filterDependencyNamesForBuildOutput(runtime, "static")).toEqual([
      "next",
      "react",
      "react-dom",
      "zod",
    ]);
  });

  it("keeps full allowlist for server build", () => {
    expect(filterDependencyNamesForBuildOutput(runtime, "server")).toEqual([
      ...runtime,
    ]);
  });
});
