import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  parseFlagOption,
  parseUrlOverrides,
  getEnvFlags,
} from "./helpers";

describe("parseFlagOption", () => {
  it("returns true for 'on' (case insensitive)", () => {
    expect(parseFlagOption("on")).toBe(true);
    expect(parseFlagOption("ON")).toBe(true);
    expect(parseFlagOption("On")).toBe(true);
  });

  it("returns false for 'off' (case insensitive)", () => {
    expect(parseFlagOption("off")).toBe(false);
    expect(parseFlagOption("OFF")).toBe(false);
    expect(parseFlagOption("Off")).toBe(false);
  });

  it("returns undefined when no override", () => {
    expect(parseFlagOption(undefined)).toBeUndefined();
    expect(parseFlagOption("")).toBeUndefined();
  });

  it("returns undefined for other values", () => {
    expect(parseFlagOption("true")).toBeUndefined();
    expect(parseFlagOption("false")).toBeUndefined();
    expect(parseFlagOption("1")).toBeUndefined();
    expect(parseFlagOption("yes")).toBeUndefined();
  });
});

describe("parseUrlOverrides", () => {
  it("returns {} for null or empty header", () => {
    expect(parseUrlOverrides(null)).toEqual({});
    expect(parseUrlOverrides("")).toEqual({});
  });

  it("parses valid JSON object with string values", () => {
    expect(parseUrlOverrides('{"isDebug":"on","isLocal":"off"}')).toEqual({
      isDebug: "on",
      isLocal: "off",
    });
  });

  it("returns {} for invalid JSON", () => {
    expect(parseUrlOverrides("not json")).toEqual({});
    expect(parseUrlOverrides("{")).toEqual({});
  });

  it("ignores non-string values and keeps only string key-value pairs", () => {
    expect(
      parseUrlOverrides('{"a":"1","b":2,"c":null,"d":true}')
    ).toEqual({ a: "1" });
  });

  it("returns {} for JSON array or null", () => {
    expect(parseUrlOverrides("[]")).toEqual({});
    expect(parseUrlOverrides("null")).toEqual({});
  });
});

describe("getEnvFlags", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns env vars by explicit keys", () => {
    process.env.FEATURE_X = "on";
    process.env.FEATURE_Y = "off";
    expect(getEnvFlags({ envFlagKeys: ["FEATURE_X", "FEATURE_Y", "MISSING"] })).toEqual({
      FEATURE_X: "on",
      FEATURE_Y: "off",
    });
  });

  it("returns env vars by prefix", () => {
    process.env.FEATURE_IS_DEBUG = "on";
    process.env.FEATURE_OTHER = "x";
    process.env.NOT_FEATURE = "y";
    const result = getEnvFlags({ envFlagPrefix: "FEATURE_" });
    expect(result).toMatchObject({
      FEATURE_IS_DEBUG: "on",
      FEATURE_OTHER: "x",
    });
    expect(result).not.toHaveProperty("NOT_FEATURE");
  });

  it("returns {} when no options", () => {
    process.env.FEATURE_X = "on";
    expect(getEnvFlags({})).toEqual({});
  });
});
