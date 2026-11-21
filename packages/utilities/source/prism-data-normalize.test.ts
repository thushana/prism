import { describe, expect, it, vi } from "vitest";
import { PrismDataNormalize } from "./prism-data-normalize";

describe("PrismDataNormalize.url", () => {
  it("trims, adds https, lowercases, and strips www, default ports, tracking, and a trailing slash", () => {
    expect(
      PrismDataNormalize.url(
        "  HTTPS://WWW.AlamedaCA.gov:443/Departments/Police/?Utm_Source=newsletter&Foo=Bar#Hours  "
      )
    ).toBe("https://alamedaca.gov/departments/police?foo=bar#Hours");
  });

  it("adds https when the scheme is missing", () => {
    expect(PrismDataNormalize.url("alamedaca.gov/Departments")).toBe(
      "https://alamedaca.gov/departments"
    );
  });

  it("keeps an explicit http scheme and the site root", () => {
    expect(PrismDataNormalize.url("http://alamedaca.gov/")).toBe(
      "http://alamedaca.gov/"
    );
  });

  it("returns an unparseable value trimmed", () => {
    expect(PrismDataNormalize.url("  not a url  ")).toBe("not a url");
  });
});

describe("PrismDataNormalize.email", () => {
  it("lowercases, strips mailto, and pulls the address out of a display name", () => {
    expect(
      PrismDataNormalize.email("  Police Dept <Police@AlamedaCA.gov>  ")
    ).toBe("police@alamedaca.gov");
    expect(PrismDataNormalize.email("mailto:Info@AlamedaCA.gov")).toBe(
      "info@alamedaca.gov"
    );
  });
});

describe("PrismDataNormalize.phone", () => {
  it("formats a US number as +1.NXX.NXX.XXXX", () => {
    expect(PrismDataNormalize.phone("510-337-8340")).toBe("+1.510.337.8340");
    expect(PrismDataNormalize.phone("(510) 337-8340")).toBe("+1.510.337.8340");
    expect(PrismDataNormalize.phone("1-510-337-8340")).toBe("+1.510.337.8340");
  });

  it("keeps a trailing extension", () => {
    expect(PrismDataNormalize.phone("510-337-8340 ext. 12")).toBe(
      "+1.510.337.8340 x12"
    );
  });

  it("leaves a short number unchanged", () => {
    expect(PrismDataNormalize.phone("911")).toBe("911");
  });
});

describe("PrismDataNormalize.address", () => {
  it("uses the USPS standardized line when Google returns one", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          result: {
            uspsData: {
              standardizedAddress: {
                firstAddressLine: "2263 SANTA CLARA AVE",
                city: "ALAMEDA",
                state: "CA",
                zipCode: "94501",
                zipCodeExtension: "4404",
              },
            },
          },
        }),
        { status: 200 }
      );
    });

    await expect(
      PrismDataNormalize.address("2263 Santa Clara Ave, Alameda", {
        apiKey: "test-key",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).resolves.toBe("2263 SANTA CLARA AVE, ALAMEDA, CA 94501-4404");
  });

  it("keeps the collapsed original when Google is unavailable", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 403 }));
    await expect(
      PrismDataNormalize.address("  2263   Santa Clara Ave  ", {
        apiKey: "test-key",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).resolves.toBe("2263 Santa Clara Ave");
  });

  it("does not call Google without an API key", async () => {
    const fetchImpl = vi.fn();
    await expect(
      PrismDataNormalize.address("2263 Santa Clara Ave", {
        apiKey: "  ",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).resolves.toBe("2263 Santa Clara Ave");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
