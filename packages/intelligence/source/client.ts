/**
 * AI Client - Centralized AI model access via Vercel AI Gateway
 * Server-side only - routes all requests through Vercel AI Gateway
 */

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createGateway } from "@ai-sdk/gateway";
import "server-only";
import { getModelConfig } from "./utilities/models";

/**
 * Cached gateway provider instance
 * Memoized to avoid creating multiple instances per process
 */
let cachedGateway: ReturnType<typeof createGateway> | null = null;

/**
 * Get or create gateway provider instance
 */
function getGatewayProvider() {
  if (cachedGateway) {
    return cachedGateway;
  }

  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY;
  if (!gatewayApiKey) {
    throw new Error("AI_GATEWAY_API_KEY environment variable is not set");
  }

  cachedGateway = createGateway({ apiKey: gatewayApiKey });
  return cachedGateway;
}

/**
 * Get AI model instance through Vercel AI Gateway
 * Supports "provider/model" format (e.g., "openai/gpt-5-nano") - recommended
 * Also supports legacy format: key from models.config.json
 */
export function getAIModel(modelId: string) {
  const gatewayEnabled = process.env.AI_GATEWAY_ENABLED !== "false";

  // Gateway format: "provider/model-name"
  if (modelId.includes("/")) {
    const [provider, model] = modelId.split("/");

    if (!gatewayEnabled) {
      // Bypass gateway for direct provider access (local testing)
      return getDirectProviderModel(provider, model);
    }

    // Use gateway provider - automatically routes through Vercel AI Gateway
    const gateway = getGatewayProvider();
    return gateway(modelId);
  }

  // Legacy format: Look up in models.config.json
  const config = getModelConfig(modelId);
  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  if (!gatewayEnabled) {
    return getDirectProviderModel(config.provider, config.apiIdentifier);
  }

  // Convert legacy model ID to gateway format
  const gatewayModelId = `${config.provider}/${config.apiIdentifier}`;
  const gateway = getGatewayProvider();
  return gateway(gatewayModelId);
}

/**
 * Get model directly from provider (bypass gateway)
 * Used for local testing when AI_GATEWAY_ENABLED=false
 */
function getDirectProviderModel(provider: string, apiIdentifier: string) {
  switch (provider) {
    case "openai":
      return openai(apiIdentifier);
    case "anthropic":
      return anthropic(apiIdentifier);
    case "google":
      return google(apiIdentifier);
    case "xai":
      throw new Error(
        "Direct provider access for xAI is not supported. Enable AI_GATEWAY_ENABLED or choose a supported provider."
      );
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Get default/recommended model
 */
export function getDefaultModel() {
  const defaultModelId =
    process.env.AI_DEFAULT_MODEL || "google/gemini-3-flash";
  return getAIModel(defaultModelId);
}

/**
 * Check if gateway is enabled
 */
export function isGatewayEnabled(): boolean {
  return process.env.AI_GATEWAY_ENABLED !== "false";
}

/**
 * Check if AI client is configured properly
 */
export function isConfigured(): boolean {
  if (isGatewayEnabled()) {
    return !!process.env.AI_GATEWAY_API_KEY;
  }
  return true; // Direct mode doesn't require gateway key
}
