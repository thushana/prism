import { vi } from "vitest";

// Mock server-only module for tests
vi.mock("server-only", () => ({}));

// Set test environment log levels
process.env.NEXT_PUBLIC_LOG_LEVEL = "silly";
process.env.LOG_LEVEL = "silly";
process.env.NODE_ENV = "test";
