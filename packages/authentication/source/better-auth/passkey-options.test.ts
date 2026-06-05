import { describe, expect, it } from "vitest";
import { resolvePasskeyRelyingParty } from "./passkey-options";

describe("resolvePasskeyRelyingParty", () => {
  it("uses porch-scope.localhost as RP ID for Prism dev hostnames", () => {
    const result = resolvePasskeyRelyingParty({
      baseURL: "http://porch-scope.localhost:9876",
      rpName: "Porch Scope",
    });

    expect(result.rpID).toBe("porch-scope.localhost");
    expect(result.origin).toBe("http://porch-scope.localhost:9876");
  });

  it("keeps localhost RP ID for bare localhost", () => {
    const result = resolvePasskeyRelyingParty({
      baseURL: "http://localhost:9876",
      rpName: "Porch Scope",
    });

    expect(result.rpID).toBe("localhost");
  });
});
