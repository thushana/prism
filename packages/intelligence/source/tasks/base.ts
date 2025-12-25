/**
 * Base Task class with automatic infrastructure
 * All tasks extend this class to get validation, retry, cost tracking, etc.
 */

import type { z } from "zod";
import { serverLogger as logger } from "logger";
import { trackCost } from "../utilities/cost";
import { withRetry, getErrorMessage } from "../utilities/retry";
import type { Task, TaskConfig, TaskResult, ExecutionResult } from "./types";

/**
 * Abstract base class for AI tasks
 * Provides automatic infrastructure for all tasks
 */
export abstract class BaseTask<TInput, TOutput> implements Task<
  TInput,
  TOutput
> {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: z.ZodSchema<TInput>;
  abstract outputSchema: z.ZodSchema<TOutput>;

  defaultConfig: TaskConfig = {
    model: "google/gemini-3-flash",
    temperature: 0.7,
    maxTokens: 500,
    retries: 3,
  };

  /**
   * Execute task with automatic infrastructure
   */
  async execute(
    input: TInput,
    config?: Partial<TaskConfig>
  ): Promise<TaskResult<TOutput>> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      // 1. Validate input
      const validatedInput = this.validateInput(input);

      // 2. Execute with retry
      const result = await withRetry(
        () => this.executeTask(validatedInput, finalConfig),
        {
          maxRetries: finalConfig.retries,
          onRetry: (attempt, error) => {
            logger.debug(`Retry attempt ${attempt} for task: ${this.name}`, {
              error: getErrorMessage(error),
            });
          },
        }
      );

      // 3. Validate output
      const validatedOutput = this.validateOutput(result.data);

      // 4. Track cost
      let cost = 0;
      let costTrackingFailed = false;
      if (result.usage) {
        const trackedCost = trackCost(
          result.usage,
          finalConfig.model,
          this.name
        );
        if (
          trackedCost === 0 &&
          (result.usage.promptTokens > 0 || result.usage.completionTokens > 0)
        ) {
          // Cost tracking failed (returned 0 despite having token usage)
          costTrackingFailed = true;
          logger.warn(`Cost tracking failed for task: ${this.name}`);
        } else {
          cost = trackedCost;
        }
      }

      // 5. Return success result
      const durationMs = Date.now() - startTime;
      logger.info(`Task completed: ${this.name}`, {
        durationMs,
        tokensUsed: result.usage?.totalTokens || 0,
        costUsd: cost,
        model: finalConfig.model,
      });

      return {
        success: true,
        data: validatedOutput,
        metadata: {
          durationMs,
          tokensUsed: result.usage?.totalTokens || 0,
          costUsd: cost,
          model: finalConfig.model,
          costTrackingFailed: costTrackingFailed || undefined,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = getErrorMessage(error);

      logger.error(`Task failed: ${this.name}`, {
        error: errorMessage,
        durationMs,
      });

      return {
        success: false,
        error: errorMessage,
        metadata: {
          durationMs,
          model: finalConfig.model,
        },
      };
    }
  }

  /**
   * Validate input against schema
   */
  protected validateInput(input: TInput): TInput {
    try {
      return this.inputSchema.parse(input);
    } catch (error) {
      throw new Error(`Input validation failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Validate output against schema
   */
  protected validateOutput(output: TOutput): TOutput {
    try {
      return this.outputSchema.parse(output);
    } catch (error) {
      throw new Error(`Output validation failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Execute the actual task (implemented by subclasses)
   */
  protected abstract executeTask(
    input: TInput,
    config: TaskConfig
  ): Promise<ExecutionResult<TOutput>>;
}
