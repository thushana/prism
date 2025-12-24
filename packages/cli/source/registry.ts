/**
 * Command registration utilities
 */

import type { Command } from "commander";
import type { CommandRegistrar } from "./command";

/**
 * Register multiple commands at once
 */
export function registerCommands(
  program: Command,
  registrars: CommandRegistrar[]
): void {
  for (const registrar of registrars) {
    registrar(program);
  }
}

/**
 * Create a command registry that collects commands
 */
export class CommandRegistry {
  private registrars: CommandRegistrar[] = [];

  /**
   * Add a command to the registry
   */
  add(registrar: CommandRegistrar): this {
    this.registrars.push(registrar);
    return this;
  }

  /**
   * Register all collected commands with a program
   */
  registerAll(program: Command): void {
    registerCommands(program, this.registrars);
  }

  /**
   * Get the number of registered commands
   */
  get count(): number {
    return this.registrars.length;
  }
}

/**
 * Create a new command registry
 */
export function createRegistry(): CommandRegistry {
  return new CommandRegistry();
}
