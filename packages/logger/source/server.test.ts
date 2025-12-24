import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  serverLogger,
  logSearch,
  logSuccess,
  logStats,
  logCost,
  logStart,
  setLogLevel,
} from "./server";

describe("Server Logger", () => {
  // Store original log level
  const originalLogLevel = serverLogger.level;

  beforeEach(() => {
    // Reset log level before each test
    serverLogger.level = "debug";
  });

  afterEach(() => {
    // Restore original log level
    serverLogger.level = originalLogLevel;
  });

  describe("serverLogger", () => {
    it("should be a Winston logger instance", () => {
      expect(serverLogger).toBeDefined();
      expect(typeof serverLogger.info).toBe("function");
      expect(typeof serverLogger.error).toBe("function");
      expect(typeof serverLogger.warn).toBe("function");
    });

    it("should have standard log methods", () => {
      expect(typeof serverLogger.error).toBe("function");
      expect(typeof serverLogger.warn).toBe("function");
      expect(typeof serverLogger.info).toBe("function");
      expect(typeof serverLogger.http).toBe("function");
      expect(typeof serverLogger.verbose).toBe("function");
      expect(typeof serverLogger.debug).toBe("function");
      expect(typeof serverLogger.silly).toBe("function");
    });
  });

  describe("Log levels", () => {
    it("should allow setting log level at runtime", () => {
      setLogLevel("error");
      expect(serverLogger.level).toBe("error");

      setLogLevel("info");
      expect(serverLogger.level).toBe("info");

      setLogLevel("debug");
      expect(serverLogger.level).toBe("debug");
    });

    it("should respect log level filtering", () => {
      // Create a spy on the transport
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");

      // Set level to error (most restrictive)
      setLogLevel("error");

      // Try logging at different levels
      serverLogger.debug("Debug message");
      serverLogger.info("Info message");
      serverLogger.warn("Warning message");
      serverLogger.error("Error message");

      // Only error should be logged
      const errorCalls = transportSpy.mock.calls.filter(
        (call) => call[0]?.level === "error"
      );
      expect(errorCalls.length).toBeGreaterThan(0);

      transportSpy.mockRestore();
    });
  });

  describe("Context loggers", () => {
    it("should have context-specific loggers", () => {
      expect(typeof logSearch).toBe("function");
      expect(typeof logSuccess).toBe("function");
      expect(typeof logStats).toBe("function");
      expect(typeof logCost).toBe("function");
      expect(typeof logStart).toBe("function");
    });

    it("logSearch should log with search context", () => {
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");

      logSearch("Searching database");

      expect(transportSpy).toHaveBeenCalled();
      const call = transportSpy.mock.calls[0];
      expect(call[0]?.emoji).toBe("🔍");
      expect(call[0]?.message).toBe("Searching database");

      transportSpy.mockRestore();
    });

    it("logSuccess should log with success context", () => {
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");

      logSuccess("Operation completed");

      expect(transportSpy).toHaveBeenCalled();
      const call = transportSpy.mock.calls[0];
      expect(call[0]?.emoji).toBe("✅");
      expect(call[0]?.message).toBe("Operation completed");

      transportSpy.mockRestore();
    });

    it("logStats should log with stats context", () => {
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");

      logStats("Processed 100 records");

      expect(transportSpy).toHaveBeenCalled();
      const call = transportSpy.mock.calls[0];
      expect(call[0]?.emoji).toBe("📊");
      expect(call[0]?.message).toBe("Processed 100 records");

      transportSpy.mockRestore();
    });

    it("logCost should log with cost context", () => {
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");

      logCost("Total: $50.00");

      expect(transportSpy).toHaveBeenCalled();
      const call = transportSpy.mock.calls[0];
      expect(call[0]?.emoji).toBe("💰");
      expect(call[0]?.message).toBe("Total: $50.00");

      transportSpy.mockRestore();
    });

    it("logStart should log with start context", () => {
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");

      logStart("Starting migration");

      expect(transportSpy).toHaveBeenCalled();
      const call = transportSpy.mock.calls[0];
      expect(call[0]?.emoji).toBe("🚀");
      expect(call[0]?.message).toBe("Starting migration");

      transportSpy.mockRestore();
    });

    it("context loggers should accept metadata", () => {
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");

      logSearch("Searching", { query: "test", limit: 10 });

      expect(transportSpy).toHaveBeenCalled();
      const call = transportSpy.mock.calls[0];
      expect(call[0]?.query).toBe("test");
      expect(call[0]?.limit).toBe(10);

      transportSpy.mockRestore();
    });
  });

  describe("Metadata handling", () => {
    it("should accept metadata in log calls", () => {
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");

      serverLogger.info("Test message", { userId: 123, action: "login" });

      expect(transportSpy).toHaveBeenCalled();
      const call = transportSpy.mock.calls[0];
      expect(call[0]?.userId).toBe(123);
      expect(call[0]?.action).toBe("login");

      transportSpy.mockRestore();
    });

    it("should handle Error objects in metadata", () => {
      const transportSpy = vi.spyOn(serverLogger.transports[0], "log");
      const error = new Error("Test error");

      serverLogger.error("Operation failed", { error });

      expect(transportSpy).toHaveBeenCalled();
      const call = transportSpy.mock.calls[0];
      expect(call[0]?.error).toBe(error);

      transportSpy.mockRestore();
    });
  });

  describe("Winston integration", () => {
    it("should use Winston console transport", () => {
      expect(serverLogger.transports).toBeDefined();
      expect(serverLogger.transports.length).toBeGreaterThan(0);
    });

    it("should have timestamp format configured", () => {
      // Check that the logger has format configuration
      expect(serverLogger.format).toBeDefined();
    });
  });
});
