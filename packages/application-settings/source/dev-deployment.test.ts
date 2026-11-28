import { afterEach, describe, expect, it } from "vitest";
import {
  hashWorktreeDevPort,
  resolveDevDeployment,
  resolvePrismBetterAuthUrl,
  resolveTrustedAuthOrigins,
  resolveWorktreeLabel,
} from "./dev-deployment";
import type { PrismConfigBase } from "./prism-config-schema";

const baseConfig: PrismConfigBase = {
  app: {
    nameIdentifier: undefined,
    nameDisplay: "Test",
    description: "Test app",
    icon: undefined,
    reservedSubdomainLabels: undefined,
  },
};

const porchConfig: PrismConfigBase = {
  ...baseConfig,
  app: {
    ...baseConfig.app,
    nameIdentifier: "porch-scope",
  },
  deployments: { dev: { port: 9876 } },
};

describe("resolveDevDeployment", () => {
  it("builds porch-scope.localhost URL from nameIdentifier and port", () => {
    const deployment = resolveDevDeployment(porchConfig, {
      appPackageName: "web",
      monorepoPackageName: "porch-scope",
    });

    expect(deployment.url).toBe("http://porch-scope.localhost:9876");
    expect(deployment.host).toBe("porch-scope.localhost");
    expect(deployment.nameIdentifier).toBe("porch-scope");
    expect(deployment.worktreeLabel).toBeUndefined();
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

  it("prefixes worktree label and hashes a stable port from checkout root", () => {
    const checkoutRoot = "/Users/dev/Code/porch-scope-pdf";
    const expectedPort = hashWorktreeDevPort(checkoutRoot, 9876);

    const first = resolveDevDeployment(porchConfig, {
      checkoutRoot,
      monorepoPackageName: "porch-scope",
    });
    const second = resolveDevDeployment(porchConfig, {
      checkoutRoot,
      monorepoPackageName: "porch-scope",
    });

    expect(first.worktreeLabel).toBe("pdf");
    expect(first.host).toBe("pdf.porch-scope.localhost");
    expect(first.port).toBe(expectedPort);
    expect(first.url).toBe(`http://pdf.porch-scope.localhost:${expectedPort}`);
    expect(second.port).toBe(first.port);
  });

  it("treats basename equal to nameIdentifier as main checkout", () => {
    const deployment = resolveDevDeployment(porchConfig, {
      checkoutRoot: "/Users/dev/Code/porch-scope",
    });

    expect(deployment.worktreeLabel).toBeUndefined();
    expect(deployment.host).toBe("porch-scope.localhost");
    expect(deployment.port).toBe(9876);
  });
});

describe("resolveWorktreeLabel", () => {
  it("strips the nameIdentifier prefix from the basename", () => {
    expect(
      resolveWorktreeLabel("/tmp/city-observatory-notes", "city-observatory")
    ).toBe("notes");
  });

  it("uses the full basename when it is not prefixed", () => {
    expect(resolveWorktreeLabel("/tmp/pathtogo", "city-observatory")).toBe(
      "pathtogo"
    );
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

  it("upgrades main *.localhost env to a worktree deployment URL", () => {
    expect(
      resolvePrismBetterAuthUrl(
        "http://porch-scope.localhost:9876",
        "http://pdf.porch-scope.localhost:10421",
        false
      )
    ).toBe("http://pdf.porch-scope.localhost:10421");
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

describe("resolveDevPortOverride via resolveDevDeployment", () => {
  const originalPort = process.env.PORT;

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  it("lets PORT env override a hashed worktree port", () => {
    process.env.PORT = "3333";
    const deployment = resolveDevDeployment(porchConfig, {
      checkoutRoot: "/Users/dev/Code/porch-scope-pdf",
    });
    expect(deployment.port).toBe(3333);
    expect(deployment.host).toBe("pdf.porch-scope.localhost");
  });
});
