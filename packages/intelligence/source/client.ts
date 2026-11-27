/**
 * AI Client - Centralized AI model access via Vercel AI Gateway
 * Server-side only - routes all requests through Vercel AI Gateway
 */

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createGateway } from "@ai-sdk/gateway";
import { embed, embedMany, rerank } from "ai";
import type { EmbeddingModel, RerankingModel } from "ai";
import "server-only";
import { trackCost } from "./utilities/cost";
import { getModelConfig } from "./utilities/models";
import { withRetry } from "./utilities/retry";

/** Default document/query embedding model (Matryoshka 1024-d via Gateway). */
export const DEFAULT_EMBEDDING_MODEL = "alibaba/qwen3-embedding-8b";

/** Default stored / request dimensions for the locked embedding default. */
export const DEFAULT_EMBEDDING_DIMENSIONS = 1024;

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

/**
 * Resolve the active embedding model id from env (document vs query).
 * Document and query default to the same model unless AI_EMBEDDING_QUERY_MODEL is set.
 */
export function getEmbeddingModelId(
  purpose: "document" | "query" = "document"
): string {
  const documentModel =
    process.env.AI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
  if (purpose === "query") {
    return (
      process.env.AI_EMBEDDING_QUERY_MODEL?.trim() ||
      documentModel
    );
  }
  return documentModel;
}

/**
 * Resolve embedding output dimensions from env.
 */
export function getEmbeddingDimensions(): number {
  const raw = process.env.AI_EMBEDDING_DIMENSIONS?.trim();
  if (!raw) return DEFAULT_EMBEDDING_DIMENSIONS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `AI_EMBEDDING_DIMENSIONS must be a positive integer (got ${raw})`
    );
  }
  return parsed;
}

/**
 * Resolve optional rerank model from env. Empty / unset means rerank is off.
 */
export function getRerankModelId(): string | null {
  const model = process.env.AI_RERANK_MODEL?.trim();
  return model ? model : null;
}

function resolveGatewayModelId(modelId: string): string {
  if (modelId.includes("/")) return modelId;
  const config = getModelConfig(modelId);
  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  return `${config.provider}/${config.apiIdentifier}`;
}

/**
 * Embedding model through Gateway (preferred) or direct OpenAI for local bypass.
 * Text-only in v1 — do not add image/page embedding until Gateway + SDK support is proven.
 */
export function getEmbeddingModel(modelId?: string): EmbeddingModel {
  const resolvedId = resolveGatewayModelId(
    modelId ?? getEmbeddingModelId("document")
  );

  if (!isGatewayEnabled()) {
    const [provider, apiIdentifier] = resolvedId.split("/");
    if (provider === "openai") {
      return openai.embeddingModel(apiIdentifier);
    }
    throw new Error(
      `Direct embedding access for ${resolvedId} is not supported. Enable AI_GATEWAY_ENABLED or use an OpenAI embedding model.`
    );
  }

  return getGatewayProvider().embeddingModel(resolvedId);
}

/**
 * Reranking model through Gateway. Requires AI_RERANK_MODEL (or an explicit id).
 */
export function getRerankingModel(modelId?: string): RerankingModel {
  const resolved =
    modelId?.trim() || getRerankModelId();
  if (!resolved) {
    throw new Error(
      "No rerank model configured. Set AI_RERANK_MODEL or pass model explicitly."
    );
  }
  const resolvedId = resolveGatewayModelId(resolved);

  if (!isGatewayEnabled()) {
    throw new Error(
      `Direct rerank access for ${resolvedId} is not supported. Enable AI_GATEWAY_ENABLED.`
    );
  }

  return getGatewayProvider().rerankingModel(resolvedId);
}

export type EmbedTextPurpose = "document" | "query";

export interface EmbedTextOptions {
  /** One string or a batch of strings. */
  values: string | string[];
  /** Override model; defaults from AI_EMBEDDING_* env. */
  model?: string;
  /** Override dimensions; defaults from AI_EMBEDDING_DIMENSIONS. */
  dimensions?: number;
  /** Document vs query model selection when model is omitted. */
  purpose?: EmbedTextPurpose;
  /** Optional label for cost logs. */
  taskName?: string;
}

export interface EmbedTextResult {
  embeddings: number[][];
  model: string;
  dimensions: number;
  usage: { tokens: number };
}

/**
 * Embed text through Vercel AI Gateway (or direct OpenAI in gateway-off mode).
 * Batches via embedMany; single values use embed. Model id and dims always come
 * from env defaults unless overridden — never hard-code a Child App model choice.
 */
export async function embedText(
  options: EmbedTextOptions
): Promise<EmbedTextResult> {
  const purpose = options.purpose ?? "document";
  const modelId = options.model ?? getEmbeddingModelId(purpose);
  const dimensions = options.dimensions ?? getEmbeddingDimensions();
  const values = Array.isArray(options.values)
    ? options.values
    : [options.values];

  if (values.length === 0) {
    return {
      embeddings: [],
      model: modelId,
      dimensions,
      usage: { tokens: 0 },
    };
  }

  const model = getEmbeddingModel(modelId);

  const result = await withRetry(async () => {
    if (values.length === 1) {
      return embed({
        model,
        value: values[0]!,
        dimensions,
      }).then((single) => ({
        embeddings: [single.embedding],
        usage: single.usage,
      }));
    }

    return embedMany({
      model,
      values,
      dimensions,
    }).then((many) => ({
      embeddings: many.embeddings,
      usage: many.usage,
    }));
  });

  const tokens = result.usage?.tokens ?? 0;
  if (tokens > 0) {
    trackCost(
      { promptTokens: tokens, completionTokens: 0, totalTokens: tokens },
      modelId,
      options.taskName ?? "embedText"
    );
  }

  return {
    embeddings: result.embeddings,
    model: modelId,
    dimensions,
    usage: { tokens },
  };
}

export interface RerankDocumentsOptions {
  query: string;
  documents: string[];
  /** Override model; defaults from AI_RERANK_MODEL. */
  model?: string;
  topN?: number;
  taskName?: string;
}

export interface RerankDocumentsResult {
  ranking: Array<{
    originalIndex: number;
    score: number;
    document: string;
  }>;
  rerankedDocuments: string[];
  model: string;
}

/**
 * Rerank documents for a query through Gateway. Callers that treat rerank as
 * optional should check getRerankModelId() / SEARCH_RERANK before invoking.
 */
export async function rerankDocuments(
  options: RerankDocumentsOptions
): Promise<RerankDocumentsResult> {
  const modelId =
    options.model?.trim() || getRerankModelId();
  if (!modelId) {
    throw new Error(
      "No rerank model configured. Set AI_RERANK_MODEL or pass model explicitly."
    );
  }

  const model = getRerankingModel(modelId);

  const result = await withRetry(async () =>
    rerank({
      model,
      query: options.query,
      documents: options.documents,
      topN: options.topN,
    })
  );

  return {
    ranking: result.ranking.map((item) => ({
      originalIndex: item.originalIndex,
      score: item.score,
      document: String(item.document),
    })),
    rerankedDocuments: result.rerankedDocuments.map(String),
    model: modelId,
  };
}
