/**
 * Task Registry
 * Central registry for task discovery and runtime execution
 */

import type { Task, TaskConfig, TaskResult, TaskMetadata } from "./types";

/**
 * Centralized registry for AI tasks
 * Allows tasks to be registered and executed by name
 */
export class TaskRegistry {
  private static tasks = new Map<string, Task<any, any>>();

  /**
   * Register a task
   */
  static register<T extends Task<any, any>>(task: T): void {
    if (this.tasks.has(task.name)) {
      throw new Error(`Task "${task.name}" is already registered`);
    }
    this.tasks.set(task.name, task);
  }

  /**
   * Get a task by name
   */
  static get(name: string): Task<any, any> | undefined {
    return this.tasks.get(name);
  }

  /**
   * Check if a task is registered
   */
  static has(name: string): boolean {
    return this.tasks.has(name);
  }

  /**
   * List all registered tasks
   */
  static list(): Array<{ name: string; description: string }> {
    return Array.from(this.tasks.values()).map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }

  /**
   * Get task metadata
   */
  static getMetadata(name: string): TaskMetadata | undefined {
    const task = this.tasks.get(name);
    if (!task) {
      return undefined;
    }

    return {
      name: task.name,
      description: task.description,
      inputSchema: task.inputSchema,
      outputSchema: task.outputSchema,
    };
  }

  /**
   * Execute a task by name
   */
  static async execute<TInput, TOutput>(
    name: string,
    input: TInput,
    config?: Partial<TaskConfig>
  ): Promise<TaskResult<TOutput>> {
    const task = this.get(name);
    if (!task) {
      return {
        success: false,
        error: `Task "${name}" not found`,
      };
    }

    try {
      return await task.execute(input, config);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Unregister a task (for testing)
   */
  static unregister(name: string): boolean {
    return this.tasks.delete(name);
  }

  /**
   * Clear all registered tasks (for testing)
   */
  static clear(): void {
    this.tasks.clear();
  }

  /**
   * Get count of registered tasks
   */
  static count(): number {
    return this.tasks.size;
  }
}
