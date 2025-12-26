/**
 * Intelligence Package - Main exports
 * Centralized LLM infrastructure for model-powered features
 *
 * Usage:
 * - Client: import { getAIModel, getDefaultModel } from "@intelligence/client"
 * - Utilities: import { trackCost, withRetry } from "@intelligence/utilities/*"
 * - Tasks: import { BaseTask, TaskRegistry } from "@intelligence/tasks/*"
 */

// Re-export client
export {
  getAIModel,
  getDefaultModel,
  isGatewayEnabled,
  isConfigured,
} from "./client";

// Re-export utilities
export {
  trackCost,
  formatCost,
  sumCosts,
  estimateCost,
} from "./utilities/cost";

export type { TokenUsage, CostMetadata } from "./utilities/cost";

export {
  getModelConfig,
  getActiveModels,
  getRecommendedModel,
  calculateCost,
  supportsCapability,
  getModelsByCapability,
  getProviderConfig,
  getProviders,
} from "./utilities/models";

export type { ModelConfig, ProviderConfig } from "./utilities/models";

export {
  withRetry,
  isRetryableError,
  getErrorMessage,
  isClientError,
  isServerError,
} from "./utilities/retry";

export type { RetryOptions } from "./utilities/retry";

// Re-export task infrastructure
export { BaseTask } from "./tasks/base";
export { TaskRegistry } from "./tasks/registry";

export type {
  Task,
  TaskConfig,
  TaskResult,
  ExecutionResult,
  TaskMetadata,
} from "./tasks/types";
