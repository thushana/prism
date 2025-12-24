/**
 * Model configuration utilities
 * Helpers for working with model metadata, pricing, and capabilities
 */

import modelsConfig from "../../models.config.json";

export interface ModelConfig {
  name: string;
  provider: string;
  apiIdentifier: string;
  description: string;
  status: "active" | "deprecated" | "experimental";
  pricing: {
    currency: string;
    inputCostPer1MTokens: number;
    outputCostPer1MTokens: number;
    cacheReadCostPer1MTokens?: number;
    cacheWriteCostPer1MTokens?: number;
    lastVerified: string;
  };
  capabilities: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    json: boolean;
    webSearch: boolean;
    maxContextTokens: number;
  };
  defaultSettings: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  limits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  recommended?: boolean;
  aliases?: string[];
}

export interface ProviderConfig {
  name: string;
  apiKeyEnvVar: string;
  sdkPackage: string;
  docsUrl: string;
  pricingUrl: string;
}

/**
 * Resolve model by ID (supports provider/model and legacy aliases)
 */
export function resolveModel(
  modelId: string
): { id: string; config: ModelConfig } | null {
  const models = modelsConfig.models as Record<string, ModelConfig>;

  // Direct hit
  if (models[modelId]) {
    return { id: modelId, config: models[modelId] };
  }

  // Legacy / alias lookup
  const entry = Object.entries(models).find(([, model]) => {
    return (
      model.aliases?.includes(modelId) ||
      model.apiIdentifier === modelId ||
      modelId === model.name
    );
  });

  if (entry) {
    const [id, config] = entry;
    return { id, config };
  }

  return null;
}

/**
 * Get model configuration by ID (supports provider/model and legacy aliases)
 */
export function getModelConfig(modelId: string): ModelConfig | null {
  return resolveModel(modelId)?.config || null;
}

/**
 * Get all active models
 */
export function getActiveModels(): ModelConfig[] {
  return Object.values(
    modelsConfig.models as Record<string, ModelConfig>
  ).filter((m) => m.status === "active");
}

/**
 * Get recommended model
 */
export function getRecommendedModel(): ModelConfig {
  const recommended = Object.values(
    modelsConfig.models as Record<string, ModelConfig>
  ).find((m) => m.recommended);
  return (
    recommended ||
    (modelsConfig.models as Record<string, ModelConfig>)[
      "google/gemini-3-flash"
    ]
  );
}

/**
 * Calculate cost from token usage
 */
export function calculateCost(
  modelId: string,
  usage: { promptTokens: number; completionTokens: number }
): number {
  const resolved = resolveModel(modelId);
  if (!resolved) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const model = resolved.config;
  const inputCost =
    usage.promptTokens * (model.pricing.inputCostPer1MTokens / 1_000_000);
  const outputCost =
    usage.completionTokens * (model.pricing.outputCostPer1MTokens / 1_000_000);

  return inputCost + outputCost;
}

/**
 * Check if model supports a capability
 */
export function supportsCapability(
  modelId: string,
  capability: keyof ModelConfig["capabilities"]
): boolean {
  const model = getModelConfig(modelId);
  const value = model?.capabilities[capability];
  return typeof value === "boolean" ? value : false;
}

/**
 * Get models by capability
 */
export function getModelsByCapability(
  capability: keyof ModelConfig["capabilities"]
): ModelConfig[] {
  return Object.values(
    modelsConfig.models as Record<string, ModelConfig>
  ).filter((m) => m.status === "active" && m.capabilities[capability]);
}

/**
 * Get provider configuration
 */
export function getProviderConfig(providerId: string): ProviderConfig | null {
  return (
    (modelsConfig.providers as Record<string, ProviderConfig>)[providerId] ||
    null
  );
}

/**
 * Get all providers
 */
export function getProviders(): ProviderConfig[] {
  return Object.values(
    modelsConfig.providers as Record<string, ProviderConfig>
  );
}
