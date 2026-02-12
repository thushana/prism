/**
 * Interactive prompt utilities using inquirer
 *
 * Provides reusable prompt patterns for CLI applications.
 */

import inquirer from "inquirer";
import type { Question } from "inquirer";

/**
 * Choice option for prompts
 */
export interface PromptChoice<T = unknown> {
  name: string;
  value: T;
  short?: string;
}

/**
 * Prompt for multi-select (checkbox)
 */
export async function promptMultiSelect<T>(
  message: string,
  choices: PromptChoice<T>[],
  options?: {
    validate?: (input: T[]) => boolean | string;
    default?: T[];
  }
): Promise<T[]> {
  const result = await inquirer.prompt<{ selected: T[] }>([
    {
      type: "checkbox",
      name: "selected",
      message,
      choices: choices.map((choice) => ({
        name: choice.name,
        value: choice.value,
        short: choice.short,
      })),
      validate: options?.validate
        ? (input: T[]) => {
            const validation = options.validate!(input);
            if (typeof validation === "string") {
              return validation;
            }
            return validation || "Please make a selection";
          }
        : (input: T[]) => {
            if (input.length === 0) {
              return "Please select at least one option";
            }
            return true;
          },
      default: options?.default,
    },
  ]);

  return result.selected;
}

/**
 * Prompt for single select (list)
 */
export async function promptSelect<T>(
  message: string,
  choices: PromptChoice<T>[],
  options?: {
    validate?: (input: T) => boolean | string;
    default?: T;
  }
): Promise<T> {
  const result = await inquirer.prompt<{ selected: T }>([
    {
      type: "list",
      name: "selected",
      message,
      choices: choices.map((choice) => ({
        name: choice.name,
        value: choice.value,
        short: choice.short,
      })),
      default: options?.default,
    },
  ]);

  return result.selected;
}

/**
 * Prompt for confirmation (yes/no)
 */
export async function promptConfirm(
  message: string,
  defaultValue: boolean = true
): Promise<boolean> {
  const result = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: "confirm",
      name: "confirmed",
      message,
      default: defaultValue,
    },
  ]);

  return result.confirmed;
}

/**
 * Prompt for text input
 */
export async function promptInput(
  message: string,
  options?: {
    validate?: (input: string) => boolean | string;
    default?: string;
    filter?: (input: string) => string;
  }
): Promise<string> {
  const result = await inquirer.prompt<{ input: string }>([
    {
      type: "input",
      name: "input",
      message,
      validate: options?.validate
        ? (input: string) => {
            const validation = options.validate!(input);
            if (typeof validation === "string") {
              return validation;
            }
            return validation || "Invalid input";
          }
        : undefined,
      default: options?.default,
      filter: options?.filter,
    },
  ]);

  return result.input;
}

/**
 * Prompt for password input (hidden)
 */
export async function promptPassword(
  message: string,
  options?: {
    validate?: (input: string) => boolean | string;
  }
): Promise<string> {
  const result = await inquirer.prompt<{ password: string }>([
    {
      type: "password",
      name: "password",
      message,
      mask: "*",
      validate: options?.validate
        ? (input: string) => {
            const validation = options.validate!(input);
            if (typeof validation === "string") {
              return validation;
            }
            return validation || "Invalid input";
          }
        : undefined,
    },
  ]);

  return result.password;
}

/**
 * Prompt for number input
 */
export async function promptNumber(
  message: string,
  options?: {
    validate?: (input: number) => boolean | string;
    default?: number;
    min?: number;
    max?: number;
  }
): Promise<number> {
  const result = await inquirer.prompt<{ number: number }>([
    {
      type: "number",
      name: "number",
      message,
      validate: options?.validate
        ? (input: number) => {
            const validation = options.validate!(input);
            if (typeof validation === "string") {
              return validation;
            }
            return validation || "Invalid number";
          }
        : (input: number) => {
            if (isNaN(input)) {
              return "Please enter a valid number";
            }
            if (options?.min !== undefined && input < options.min) {
              return `Number must be at least ${options.min}`;
            }
            if (options?.max !== undefined && input > options.max) {
              return `Number must be at most ${options.max}`;
            }
            return true;
          },
      default: options?.default,
    },
  ]);

  return result.number;
}

/**
 * Create a custom inquirer prompt (for advanced use cases)
 */
export async function promptCustom<T>(
  questions: Question | Question[]
): Promise<T> {
  return (await inquirer.prompt(questions)) as T;
}

/**
 * Check if user cancelled the prompt (Ctrl+C)
 */
export function isPromptCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message === "user force closed the prompt with ctrl+c" ||
    message === "user force closed the prompt with sigint" ||
    message.includes("cancel") ||
    error.name === "ExitPromptError"
  );
}
