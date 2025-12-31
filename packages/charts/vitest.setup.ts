import { vi } from "vitest";

// Mock server-only module for tests
vi.mock("server-only", () => ({}));

// Set test environment variables
// @ts-expect-error - NODE_ENV needs to be set for tests
process.env.NODE_ENV = "test";

// Mock window.getComputedStyle for theme functions
Object.defineProperty(window, "getComputedStyle", {
  value: () => ({
    getPropertyValue: (prop: string) => {
      // Return default values for CSS variables in tests
      const defaults: Record<string, string> = {
        "--foreground": "oklch(0.145 0 0)",
        "--background": "oklch(1 0 0)",
        "--muted": "oklch(0.97 0 0)",
        "--muted-foreground": "oklch(0.556 0 0)",
        "--border": "oklch(0.922 0 0)",
        "--chart-1": "oklch(0.646 0.222 41.116)",
        "--chart-2": "oklch(0.6 0.118 184.704)",
        "--chart-3": "oklch(0.398 0.07 227.392)",
        "--chart-4": "oklch(0.828 0.189 84.429)",
        "--chart-5": "oklch(0.769 0.188 70.08)",
      };
      return defaults[prop] || "";
    },
  }),
});
