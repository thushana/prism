import { describe, expect, it } from "vitest";
import {
  resolveDevDeployment,
  resolvePrismBetterAuthUrl,
  resolveTrustedAuthOrigins,
} from "./dev-deployment";
import type { PrismConfigBase } from "./prism-config-schema";

const baseConfig: PrismConfigBase = {
  app: {
    nameIdentifier: undefined,
    nameDisplay: "Test",
    description: "Test app",
    icon: undefined,
  },
};

describe("resolveDevDeployment", () => {
  it("builds porch-scope.localhost URL from nameIdentifier and port", () => {
    const deployment = resolveDevDeployment(
      {
        ...baseConfig,
        app: {
          ...baseConfig.app,
          nameIdentifier: "porch-scope",
        },
        deployments: { dev: { port: 9876 } },
      },
      { appPackageName: "web", monorepoPackageName: "porch-scope" }
    );

    expect(deployment.url).toBe("http://porch-scope.localhost:9876");
    expect(deployment.host).toBe("porch-scope.localhost");
    expect(deployment.nameIdentifier).toBe("porch-scope");
    expect(deployment.origins).toContain("http://localhost:9876");
  });

  it("defaults nameIdentifier from monorepo package name when web app package", () => {
    const deployment = resolveDevDeployment(
      { ...baseConfig, deployments: { dev: { port: 8888 } } },
      { appPackageName: "web", monorepoPackageName: "timetraveler" }
    );

    expect(deployment.host).toBe("timetraveler.localhost");
    expect(deployment.url).toBe("http://timetraveler.localhost:8888");
  });

  it("honors explicit host override", () => {
    const deployment = resolveDevDeployment({
      ...baseConfig,
      deployments: {
        dev: { host: "custom.localhost", port: 1776 },
      },
    });

    expect(deployment.url).toBe("http://custom.localhost:1776");
  });
});

describe("resolvePrismBetterAuthUrl", () => {
  it("upgrades legacy localhost env to Prism dev URL in development", () => {
    expect(
      resolvePrismBetterAuthUrl(
        "http://localhost:9876",
        "http://porch-scope.localhost:9876",
        false
      )
    ).toBe("http://porch-scope.localhost:9876");
  });

  it("keeps production URL unchanged", () => {
    expect(
      resolvePrismBetterAuthUrl(
        "https://porch-scope.vercel.app",
        "http://porch-scope.localhost:9876",
        true
      )
    ).toBe("https://porch-scope.vercel.app");
  });
});

describe("resolveTrustedAuthOrigins", () => {
  it("includes canonical URL and dev alternates", () => {
    const origins = resolveTrustedAuthOrigins("http://localhost:9876", [
      "http://porch-scope.localhost:9876",
      "http://localhost:9876",
    ]);
    expect(origins).toContain("http://localhost:9876");
    expect(origins).toContain("http://porch-scope.localhost:9876");
    expect(origins).toHaveLength(2);
  });
});
