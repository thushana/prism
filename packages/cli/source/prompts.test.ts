/**
 * Tests for interactive prompt utilities
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import inquirer from "inquirer";
import {
  promptMultiSelect,
  promptSelect,
  promptConfirm,
  promptInput,
  promptPassword,
  promptNumber,
  isPromptCancelled,
  type PromptChoice,
} from "./prompts";

// Mock inquirer
vi.mock("inquirer");

describe("Interactive Prompts", () => {
  const mockInquirer = vi.mocked(inquirer);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("promptMultiSelect", () => {
    it("should return selected values", async () => {
      const choices: PromptChoice<number>[] = [
        { name: "Option 1", value: 1 },
        { name: "Option 2", value: 2 },
        { name: "Option 3", value: 3 },
      ];

      (mockInquirer.prompt as any) = vi.fn().mockResolvedValue({
        selected: [1, 3],
      });

      const result = await promptMultiSelect<number>(
        "Select options:",
        choices
      );

      expect(result).toEqual([1, 3]);
      expect(mockInquirer.prompt as any).toHaveBeenCalledWith([
        expect.objectContaining({
          type: "checkbox",
          name: "selected",
          message: "Select options:",
        }),
      ]);
    });

    it("should validate that at least one option is selected", async () => {
      const choices: PromptChoice<string>[] = [
        { name: "A", value: "a" },
        { name: "B", value: "b" },
      ];

      let capturedValidate: ((input: string[]) => boolean | string) | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedValidate = questions[0].validate;
          return Promise.resolve({ selected: [] });
        });

      await promptMultiSelect("Select:", choices);

      expect(capturedValidate).toBeDefined();
      expect(capturedValidate!([])).toBe("Please select at least one option");
      expect(capturedValidate!(["a"])).toBe(true);
    });

    it("should use custom validation if provided", async () => {
      const choices: PromptChoice<number>[] = [{ name: "Option 1", value: 1 }];

      const customValidate = vi.fn((input: number[]) => {
        if (input.length < 2) {
          return "Please select at least 2 options";
        }
        return true;
      });

      let capturedValidate: ((input: number[]) => boolean | string) | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedValidate = questions[0].validate;
          return Promise.resolve({ selected: [1] });
        });

      await promptMultiSelect("Select:", choices, {
        validate: customValidate,
      });

      expect(capturedValidate).toBeDefined();
      expect(capturedValidate!([1])).toBe("Please select at least 2 options");
      expect(capturedValidate!([1, 2])).toBe(true);
    });

    it("should support default values", async () => {
      const choices: PromptChoice<number>[] = [
        { name: "Option 1", value: 1 },
        { name: "Option 2", value: 2 },
      ];

      let capturedDefault: number[] | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedDefault = questions[0].default;
          return Promise.resolve({ selected: [1, 2] });
        });

      await promptMultiSelect("Select:", choices, {
        default: [1],
      });

      expect(capturedDefault).toEqual([1]);
    });
  });

  describe("promptSelect", () => {
    it("should return selected value", async () => {
      const choices: PromptChoice<string>[] = [
        { name: "Option A", value: "a" },
        { name: "Option B", value: "b" },
      ];

      (mockInquirer.prompt as any) = vi.fn().mockResolvedValue({
        selected: "a",
      });

      const result = await promptSelect<string>("Choose:", choices);

      expect(result).toBe("a");
      expect(mockInquirer.prompt as any).toHaveBeenCalledWith([
        expect.objectContaining({
          type: "list",
          name: "selected",
          message: "Choose:",
        }),
      ]);
    });

    it("should support default value", async () => {
      const choices: PromptChoice<string>[] = [
        { name: "Option A", value: "a" },
      ];

      let capturedDefault: string | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedDefault = questions[0].default;
          return Promise.resolve({ selected: "a" });
        });

      await promptSelect("Choose:", choices, {
        default: "a",
      });

      expect(capturedDefault).toBe("a");
    });
  });

  describe("promptConfirm", () => {
    it("should return boolean value", async () => {
      (mockInquirer.prompt as any) = vi.fn().mockResolvedValue({
        confirmed: true,
      });

      const result = await promptConfirm("Proceed?");

      expect(result).toBe(true);
      expect(mockInquirer.prompt as any).toHaveBeenCalledWith([
        expect.objectContaining({
          type: "confirm",
          name: "confirmed",
          message: "Proceed?",
        }),
      ]);
    });

    it("should use default value", async () => {
      let capturedDefault: boolean | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedDefault = questions[0].default;
          return Promise.resolve({ confirmed: false });
        });

      await promptConfirm("Proceed?", false);

      expect(capturedDefault).toBe(false);
    });
  });

  describe("promptInput", () => {
    it("should return input string", async () => {
      (mockInquirer.prompt as any) = vi.fn().mockResolvedValue({
        input: "test input",
      });

      const result = await promptInput("Enter text:");

      expect(result).toBe("test input");
      expect(mockInquirer.prompt as any).toHaveBeenCalledWith([
        expect.objectContaining({
          type: "input",
          name: "input",
          message: "Enter text:",
        }),
      ]);
    });

    it("should support validation", async () => {
      const validate = vi.fn((input: string) => {
        if (input.length < 3) {
          return "Must be at least 3 characters";
        }
        return true;
      });

      let capturedValidate: ((input: string) => boolean | string) | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedValidate = questions[0].validate;
          return Promise.resolve({ input: "test" });
        });

      await promptInput("Enter:", { validate });

      expect(capturedValidate).toBeDefined();
      expect(capturedValidate!("ab")).toBe("Must be at least 3 characters");
      expect(capturedValidate!("abc")).toBe(true);
    });

    it("should support filter", async () => {
      const filter = vi.fn((input: string) => input.trim().toUpperCase());

      let capturedFilter: ((input: string) => string) | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedFilter = questions[0].filter;
          return Promise.resolve({ input: "TEST" });
        });

      await promptInput("Enter:", { filter });

      expect(capturedFilter).toBe(filter);
    });
  });

  describe("promptPassword", () => {
    it("should return password string", async () => {
      (mockInquirer.prompt as any) = vi.fn().mockResolvedValue({
        password: "secret123",
      });

      const result = await promptPassword("Enter password:");

      expect(result).toBe("secret123");
      expect(mockInquirer.prompt as any).toHaveBeenCalledWith([
        expect.objectContaining({
          type: "password",
          name: "password",
          message: "Enter password:",
          mask: "*",
        }),
      ]);
    });

    it("should support validation", async () => {
      const validate = vi.fn((input: string) => {
        if (input.length < 8) {
          return "Password must be at least 8 characters";
        }
        return true;
      });

      let capturedValidate: ((input: string) => boolean | string) | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedValidate = questions[0].validate;
          return Promise.resolve({ password: "password123" });
        });

      await promptPassword("Enter:", { validate });

      expect(capturedValidate).toBeDefined();
      expect(capturedValidate!("short")).toBe(
        "Password must be at least 8 characters"
      );
      expect(capturedValidate!("longpassword")).toBe(true);
    });
  });

  describe("promptNumber", () => {
    it("should return number value", async () => {
      (mockInquirer.prompt as any) = vi.fn().mockResolvedValue({
        number: 42,
      });

      const result = await promptNumber("Enter number:");

      expect(result).toBe(42);
      expect(mockInquirer.prompt as any).toHaveBeenCalledWith([
        expect.objectContaining({
          type: "number",
          name: "number",
          message: "Enter number:",
        }),
      ]);
    });

    it("should validate min/max constraints", async () => {
      let capturedValidate: ((input: number) => boolean | string) | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedValidate = questions[0].validate;
          return Promise.resolve({ number: 10 });
        });

      await promptNumber("Enter:", {
        min: 1,
        max: 100,
      });

      expect(capturedValidate).toBeDefined();
      expect(capturedValidate!(NaN)).toBe("Please enter a valid number");
      expect(capturedValidate!(0)).toBe("Number must be at least 1");
      expect(capturedValidate!(101)).toBe("Number must be at most 100");
      expect(capturedValidate!(50)).toBe(true);
    });

    it("should support custom validation", async () => {
      const validate = vi.fn((input: number) => {
        if (input % 2 !== 0) {
          return "Number must be even";
        }
        return true;
      });

      let capturedValidate: ((input: number) => boolean | string) | undefined;

      (mockInquirer.prompt as any) = vi
        .fn()
        .mockImplementation((questions: any[]) => {
          capturedValidate = questions[0].validate;
          return Promise.resolve({ number: 4 });
        });

      await promptNumber("Enter:", { validate });

      expect(capturedValidate).toBeDefined();
      expect(capturedValidate!(3)).toBe("Number must be even");
      expect(capturedValidate!(4)).toBe(true);
    });
  });

  describe("isPromptCancelled", () => {
    it("should detect Ctrl+C cancellation", () => {
      const error = new Error("User force closed the prompt with ctrl+c");
      expect(isPromptCancelled(error)).toBe(true);
    });

    it("should detect cancellation with 'cancel' in message", () => {
      const error = new Error("Operation cancelled by user");
      expect(isPromptCancelled(error)).toBe(true);
    });

    it("should return false for other errors", () => {
      const error = new Error("Some other error");
      expect(isPromptCancelled(error)).toBe(false);
    });

    it("should return false for non-Error objects", () => {
      expect(isPromptCancelled("string error")).toBe(false);
      expect(isPromptCancelled(null)).toBe(false);
      expect(isPromptCancelled(undefined)).toBe(false);
    });
  });
});
