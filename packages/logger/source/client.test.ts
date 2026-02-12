import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  logger,
  logSearch,
  logSuccess,
  logStats,
  logCost,
  logStart,
} from "./client";

describe("Client Logger", () => {
  // Mock console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  let consoleLogSpy: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;
  let consoleWarnSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleLogSpy = vi.fn();
    consoleErrorSpy = vi.fn();
    consoleWarnSpy = vi.fn();
    console.log = consoleLogSpy as typeof console.log;
    console.error = consoleErrorSpy as typeof console.error;
    console.warn = consoleWarnSpy as typeof console.warn;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    vi.clearAllMocks();
  });

  describe("logger.info", () => {
    it("should log info messages with emoji", () => {
      logger.info("Test message");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("ℹ️");
      expect(logMessage).toContain("[INFO]");
      expect(logMessage).toContain("Test message");
    });

    it("should include metadata when provided", () => {
      logger.info("Test message", { userId: 123, action: "login" });

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('{"userId":123,"action":"login"}');
    });

    it("should include timestamp", () => {
      logger.info("Test message");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      // Check for timestamp format: YYYY-MM-DD HH:mm:ss
      expect(logMessage).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });
  });

  describe("logger.error", () => {
    it("should log error messages with emoji", () => {
      logger.error("Error occurred");

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const logMessage = consoleErrorSpy.mock.calls[0][0];
      expect(logMessage).toContain("❌");
      expect(logMessage).toContain("[ERROR]");
      expect(logMessage).toContain("Error occurred");
    });

    it("should handle Error objects in metadata", () => {
      const error = new Error("Test error");
      logger.error("Operation failed", { error });

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const logMessage = consoleErrorSpy.mock.calls[0][0];
      expect(logMessage).toContain("Test error");
      expect(logMessage).toContain("stack");
    });
  });

  describe("logger.warn", () => {
    it("should log warning messages with emoji", () => {
      logger.warn("Warning message");

      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const logMessage = consoleWarnSpy.mock.calls[0][0];
      expect(logMessage).toContain("⚠️");
      expect(logMessage).toContain("[WARN]");
      expect(logMessage).toContain("Warning message");
    });
  });

  describe("logger.debug", () => {
    it("should log debug messages with emoji", () => {
      logger.debug("Debug info");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("🐛");
      expect(logMessage).toContain("[DEBUG]");
      expect(logMessage).toContain("Debug info");
    });
  });

  describe("logger.http", () => {
    it("should log HTTP messages with emoji", () => {
      logger.http("GET /api/users");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("🌐");
      expect(logMessage).toContain("[HTTP]");
      expect(logMessage).toContain("GET /api/users");
    });
  });

  describe("logger.verbose", () => {
    it("should log verbose messages with emoji", () => {
      logger.verbose("Verbose details");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("🗒️");
      expect(logMessage).toContain("[VERBOSE]");
      expect(logMessage).toContain("Verbose details");
    });
  });

  describe("logger.silly", () => {
    it("should log silly messages with emoji", () => {
      logger.silly("Very detailed info");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("🤹");
      expect(logMessage).toContain("[SILLY]");
      expect(logMessage).toContain("Very detailed info");
    });
  });

  describe("logger.log", () => {
    it("should log with custom level", () => {
      logger.log("info", "Custom log");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("[INFO]");
      expect(logMessage).toContain("Custom log");
    });
  });

  describe("Context loggers", () => {
    it("logSearch should log with search emoji", () => {
      logSearch("Searching for users");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("🔍");
      expect(logMessage).toContain("Searching for users");
    });

    it("logSuccess should log with success emoji", () => {
      logSuccess("Operation completed");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("✅");
      expect(logMessage).toContain("Operation completed");
    });

    it("logStats should log with stats emoji", () => {
      logStats("Processed 100 items");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("📊");
      expect(logMessage).toContain("Processed 100 items");
    });

    it("logCost should log with cost emoji", () => {
      logCost("Total: $12.50");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("💰");
      expect(logMessage).toContain("Total: $12.50");
    });

    it("logStart should log with start emoji", () => {
      logStart("Starting process");

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("🚀");
      expect(logMessage).toContain("Starting process");
    });

    it("context loggers should accept metadata", () => {
      logSearch("Searching", { query: "test", limit: 10 });

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('{"query":"test","limit":10}');
    });
  });

  describe("Metadata handling", () => {
    it("should serialize objects", () => {
      logger.info("Test", { user: { id: 1, name: "John" } });

      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain('{"user":{"id":1,"name":"John"}}');
    });

    it("should handle nested errors", () => {
      const error = new Error("Nested error");
      logger.error("Failed", { context: "test", error });

      const logMessage = consoleErrorSpy.mock.calls[0][0];
      expect(logMessage).toContain("Nested error");
      expect(logMessage).toContain("message");
      expect(logMessage).toContain("stack");
    });

    it("should handle empty metadata gracefully", () => {
      logger.info("Test", {});

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logMessage = consoleLogSpy.mock.calls[0][0];
      expect(logMessage).toContain("Test");
    });
  });
});
