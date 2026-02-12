/**
 * Task type definitions
 * Core interfaces and types for the AI task system
 */

/**
 * Type alias for Zod schemas that output a specific type
 * This is more permissive than z.ZodType to allow any Zod schema structure.
 * Uses a structural type that accepts any object with parse and safeParse methods.
 */
export type ZodSchema<T> = {
  parse: (input: unknown) => T;
  safeParse: (
    input: unknown
  ) => { success: true; data: T } | { success: false; error: unknown };
};

/**
 * Result returned by task execution
 */
export interface TaskResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    costUsd?: number;
    durationMs?: number;
    model?: string;
    retries?: number;
    costTrackingFailed?: boolean;
  };
}

/**
 * Configuration options for task execution
 */
export interface TaskConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  retries?: number;
  promptVersion?: string;
}

/**
 * Task interface that all tasks must implement
 */
export interface Task<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: ZodSchema<TInput>;
  outputSchema: ZodSchema<TOutput>;
  defaultConfig: TaskConfig;
  execute(
    input: TInput,
    config?: Partial<TaskConfig>
  ): Promise<TaskResult<TOutput>>;
}

/**
 * Internal result from task execution (before wrapping in TaskResult)
 */
export interface ExecutionResult<T> {
  data: T;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
}

/**
 * Task metadata for registry
 */
export interface TaskMetadata {
  name: string;
  description: string;
  inputSchema: ZodSchema<unknown>;
  outputSchema: ZodSchema<unknown>;
}
