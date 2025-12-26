/**
 * Cost tracking for AI operations
 * Calculates costs from token usage and logs them
 */

import { serverLogger as logger, logCost } from "@logger";
import {
  calculateCost as calculateCostFromModel,
  getModelConfig,
} from "./models";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
}

export interface CostMetadata {
  model: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  pricingVerified?: string;
  taskName?: string;
}

/**
 * Track cost of AI operation
 * Calculates cost from token usage and logs with metadata
 */
export function trackCost(
  usage: TokenUsage,
  modelId: string,
  taskName?: string
): number {
  try {
    // Calculate cost from model config
    const cost = calculateCostFromModel(modelId, {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    });

    // Get model metadata
    const model = getModelConfig(modelId);

    // Prepare cost metadata
    const metadata: CostMetadata = {
      model: modelId,
      modelName: model?.name || modelId,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens:
        usage.totalTokens || usage.promptTokens + usage.completionTokens,
      costUsd: cost,
      pricingVerified: model?.pricing.lastVerified,
      taskName,
    };

    // Log cost with emoji prefix
    logCost(`AI generation: $${cost.toFixed(6)}`, metadata);

    return cost;
  } catch (error) {
    // If cost tracking fails, log error but don't throw
    logger.error("Failed to track AI cost", {
      error,
      modelId,
      usage,
      taskName,
    });
    return 0;
  }
}

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Calculate total cost from multiple operations
 */
export function sumCosts(costs: number[]): number {
  return costs.reduce((sum, cost) => sum + cost, 0);
}

/**
 * Estimate cost before making API call
 * Useful for budget checking
 */
export function estimateCost(
  modelId: string,
  estimatedPromptTokens: number,
  estimatedCompletionTokens: number
): number {
  return calculateCostFromModel(modelId, {
    promptTokens: estimatedPromptTokens,
    completionTokens: estimatedCompletionTokens,
  });
}
