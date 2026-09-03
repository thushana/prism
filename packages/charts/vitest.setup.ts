import { vi } from "vitest";

// Mock server-only module for tests
vi.mock("server-only", () => ({}));

// Set test environment variables
// @ts-expect-error - NODE_ENV needs to be set for tests
process.env.NODE_ENV = "test";
