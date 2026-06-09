import { describe, expect, it } from "vitest";
import {
  prismConfigBaseSchema,
  resolveAuthenticationGateMode,
  resolveBuildOutput,
  resolveSignInPathDropOff,
  isStaticBuild,
} from "./prism-config-schema";

describe("prismConfigBaseSchema", () => {
  it("accepts app + deployments", () => {
    const result = prismConfigBaseSchema.safeParse({
      app: {
        nameIdentifier: "alameda-elections",
        nameDisplay: "Alameda Elections",
        description: "Test app",
        icon: "layers",
      },
      deployments: { dev: { port: 1776 } },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.app.nameDisplay).toBe("Alameda Elections");
      expect(result.data.app.nameIdentifier).toBe("alameda-elections");
    }
  });

  it("maps legacy displayName to nameDisplay", () => {
    const result = prismConfigBaseSchema.safeParse({
      app: {
        displayName: "Legacy App",
        description: "Test app",
      },
      deployments: { dev: { port: 3000 } },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.app.nameDisplay).toBe("Legacy App");
    }
  });

  it("requires app section", () => {
    const result = prismConfigBaseSchema.safeParse({
      deployments: { dev: { port: 1776 } },
    });
    expect(result.success).toBe(false);
  });

  it("accepts authentication.gateMode app and signInPathDropOff", () => {
    const result = prismConfigBaseSchema.safeParse({
      app: {
        nameDisplay: "Test",
        description: "Test app",
      },
      authentication: { gateMode: "app", signInPathDropOff: "/dashboard" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(resolveAuthenticationGateMode(result.data)).toBe("app");
      expect(resolveSignInPathDropOff(result.data)).toBe("/dashboard");
    }
  });

  it("defaults authentication gate mode and signInPathDropOff when omitted", () => {
    const result = prismConfigBaseSchema.safeParse({
      app: {
        nameDisplay: "Test",
        description: "Test app",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(resolveAuthenticationGateMode(result.data)).toBe("admin");
      expect(resolveSignInPathDropOff(result.data)).toBe("/");
    }
  });

  it("accepts build.output static and defaults omitted build to server", () => {
    const staticResult = prismConfigBaseSchema.safeParse({
      app: {
        nameDisplay: "Static App",
        description: "Static export",
      },
      build: { output: "static" },
    });
    expect(staticResult.success).toBe(true);
    if (staticResult.success) {
      expect(resolveBuildOutput(staticResult.data)).toBe("static");
      expect(isStaticBuild(staticResult.data)).toBe(true);
    }

    const serverDefault = prismConfigBaseSchema.safeParse({
      app: {
        nameDisplay: "Server App",
        description: "Server app",
      },
    });
    expect(serverDefault.success).toBe(true);
    if (serverDefault.success) {
      expect(resolveBuildOutput(serverDefault.data)).toBe("server");
      expect(isStaticBuild(serverDefault.data)).toBe(false);
    }
  });
});
