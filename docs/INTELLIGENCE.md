# AI Task System

Comprehensive guide to the AI-powered task system built on Vercel AI SDK.

## Overview

The AI task system provides a standardized, scalable architecture for integrating LLM-powered features into applications. It's designed around self-contained tasks with automatic validation, cost tracking, error handling, and retry logic.

**Powered by Vercel AI Gateway**: All AI requests route through [Vercel AI Gateway](https://vercel.com/docs/ai-gateway), providing:

- **Unified API**: Access hundreds of models through a single endpoint
- **High Reliability**: Automatic retries and fallbacks across providers
- **Zero Markup**: Tokens cost the same as direct from providers (0% markup)
- **Observability**: Built-in monitoring and spend tracking
- **Multi-Provider**: Seamlessly switch between OpenAI, Anthropic, and others

## Philosophy

- **Self-Contained Tasks**: Each task is a module with its own types, prompts, and logic
- **Automatic Infrastructure**: Validation, cost tracking, and retry logic are handled by base classes
- **Zero Side Effects**: Tasks are pure functions (input → AI → output); callers handle database/state
- **Type Safety**: Zod schemas provide runtime validation; TypeScript ensures compile-time safety
- **Observable**: All operations are logged with costs, durations, and metadata
- **Fail Gracefully**: Errors return structured results; no crashes

## Architecture

The AI system is split between generic infrastructure (reusable) and app-specific tasks:

**Generic Infrastructure** (`packages/intelligence/`):

```
packages/intelligence/
├── models.config.json           # Model metadata, pricing, capabilities
├── source/
│   ├── client.ts                # AI client setup (shared)
│   ├── utilities/               # Shared utilities
│   │   ├── cost.ts              # Automatic cost tracking
│   │   ├── retry.ts             # Retry logic with exponential backoff
│   │   └── models.ts            # Model config loader and helpers
│   └── tasks/                   # Task infrastructure (base classes)
│       ├── base.ts              # BaseTask abstract class (infrastructure)
│       ├── types.ts             # Shared task types
│       └── registry.ts          # Task registry for discoverability
```

**App-Specific Tasks** (`apps/{app}/intelligence/tasks/`):

```
apps/{app}/intelligence/tasks/   # App-specific tasks
├── index.ts                     # Export all tasks
└── {task-name}/                 # Self-contained task modules
    ├── index.ts                 # Task implementation
    ├── prompt.ts                # Versioned prompts
    └── types.ts                 # Task-specific types + Zod schemas
```

**Why This Structure?**

- **Generic Infrastructure** (`packages/intelligence/`): Reusable across all apps (client, utilities, base classes)
- **App-Specific Tasks** (`apps/{app}/intelligence/tasks/`): Tasks are application-specific and define what each app does with AI
- **Separation of Concerns**: Infrastructure is shared; tasks are app-specific

## Core Components

### 1. Model Configuration (`models.config.json`)

Centralized configuration for all AI models with metadata, pricing, and capabilities.

**Structure:**

```json
{
  "models": {
    "gpt-4o-mini": {
      "name": "GPT-4o Mini",
      "provider": "openai",
      "apiIdentifier": "gpt-4o-mini",
      "description": "Cost-effective model with good quality",
      "status": "active",
      "pricing": {
        "currency": "USD",
        "inputCostPer1MTokens": 0.15,
        "outputCostPer1MTokens": 0.6,
        "lastVerified": "2025-12-09"
      },
      "capabilities": {
        "streaming": true,
        "functionCalling": true,
        "vision": true,
        "json": true,
        "maxContextTokens": 128000
      },
      "defaultSettings": {
        "temperature": 0.7,
        "maxTokens": 500,
        "topP": 1.0
      },
      "limits": {
        "requestsPerMinute": 500,
        "tokensPerMinute": 200000
      },
      "recommended": true
    }
  },
  "providers": {
    "openai": {
      "name": "OpenAI",
      "apiKeyEnvVar": "OPENAI_API_KEY",
      "sdkPackage": "@ai-sdk/openai",
      "docsUrl": "https://platform.openai.com/docs",
      "pricingUrl": "https://openai.com/api/pricing/"
    }
  }
}
```

**Features:**

- Single source of truth for model metadata
- Pricing data for accurate cost tracking
- Capability flags (streaming, function calling, vision, JSON mode)
- Default settings per model
- Rate limits and context window sizes
- Status tracking (active, deprecated, experimental)
- Provider metadata and documentation links

**Benefits:**

- Easy to update pricing (one place)
- Compare models programmatically
- Validate model capabilities before use
- Generate model selection UI dynamically
- Track pricing verification dates

**Helper Functions (`utilities/models.ts`):**

```typescript
import modelsConfig from "../models.config.json";

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
    lastVerified: string;
  };
  capabilities: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    json: boolean;
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

// Get model configuration (supports provider/model and legacy aliases)
export function getModelConfig(modelId: string): ModelConfig | null {
  const models = modelsConfig.models as Record<string, ModelConfig>;
  const direct = models[modelId];
  if (direct) return direct;

  const aliasMatch = Object.values(models).find(
    (m) =>
      m.aliases?.includes(modelId) ||
      m.apiIdentifier === modelId ||
      m.name === modelId
  );

  return aliasMatch || null;
}

// Get all active models
export function getActiveModels(): ModelConfig[] {
  return Object.values(modelsConfig.models).filter(
    (m) => m.status === "active"
  );
}

// Get recommended model
export function getRecommendedModel(): ModelConfig {
  const recommended = Object.values(modelsConfig.models).find(
    (m) => m.recommended
  );
  return recommended || modelsConfig.models["google/gemini-3-flash"];
}

// Calculate cost from token usage
export function calculateCost(
  modelId: string,
  usage: { promptTokens: number; completionTokens: number }
): number {
  const model = getModelConfig(modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const inputCost =
    usage.promptTokens * (model.pricing.inputCostPer1MTokens / 1_000_000);
  const outputCost =
    usage.completionTokens * (model.pricing.outputCostPer1MTokens / 1_000_000);

  return inputCost + outputCost;
}

// Check if model supports capability
export function supportsCapability(
  modelId: string,
  capability: keyof ModelConfig["capabilities"]
): boolean {
  const model = getModelConfig(modelId);
  return model?.capabilities[capability] ?? false;
}

// Get models by capability
export function getModelsByCapability(
  capability: keyof ModelConfig["capabilities"]
): ModelConfig[] {
  return Object.values(modelsConfig.models).filter(
    (m) => m.status === "active" && m.capabilities[capability]
  );
}
```

**Usage:**

```typescript
import {
  getModelConfig,
  calculateCost,
  supportsCapability,
} from "@intelligence/utilities/models"; // Import via path alias

// Get model details
const model = getModelConfig("openai/gpt-5-nano");
console.log(model.description); // "Cost-effective model..."

// Calculate cost
const cost = calculateCost("openai/gpt-5-nano", {
  promptTokens: 250,
  completionTokens: 100,
});
console.log(`Cost: $${cost.toFixed(6)}`);

// Check capabilities
if (supportsCapability("openai/gpt-4o-mini", "vision")) {
  // Use vision features
}

// List models with streaming
const streamingModels = getModelsByCapability("streaming");
```

### 2. AI Client (`client.ts`)

Centralized AI client configuration using Vercel AI Gateway via `@ai-sdk/gateway`.

**Implementation Pattern:**

The client uses `createGateway` from `@ai-sdk/gateway` to route all requests through Vercel AI Gateway. When using string model IDs (e.g., `'openai/gpt-5'`), the AI SDK automatically uses the gateway if `AI_GATEWAY_API_KEY` is set.

```typescript
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
export function getAIModel(
  modelId: string,
  options?: { cacheControl?: boolean }
) {
  const gatewayEnabled = process.env.AI_GATEWAY_ENABLED !== "false";

  // Gateway format: "provider/model-name"
  if (modelId.includes("/")) {
    const [provider, model] = modelId.split("/");

    if (!gatewayEnabled) {
      // Bypass gateway for direct provider access (local testing)
      return getDirectProviderModel(provider, model, options);
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
    return getDirectProviderModel(
      config.provider,
      config.apiIdentifier,
      options
    );
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
function getDirectProviderModel(
  provider: string,
  apiIdentifier: string,
  options?: { cacheControl?: boolean }
) {
  switch (provider) {
    case "openai":
      return openai(
        apiIdentifier,
        options?.cacheControl ? { cacheControl: true } : undefined
      );
    case "anthropic":
      return anthropic(
        apiIdentifier,
        options?.cacheControl ? { cacheControl: true } : undefined
      );
    case "google":
      return google(apiIdentifier);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export function getDefaultModel() {
  const defaultModelId =
    process.env.AI_DEFAULT_MODEL || "google/gemini-3-flash";
  return getAIModel(defaultModelId);
}
```

**Features:**

- Routes all requests through Vercel AI Gateway via `@ai-sdk/gateway`'s `createGateway`
- Multi-provider support (OpenAI, Anthropic, Google, xAI)
- Supports "provider/model" format (e.g., "openai/gpt-5-nano") - recommended
- Legacy support for models.config.json keys
- Server-side only (enforced by `server-only` package)
- Validates gateway token and model config
- Single source of truth for model access
- Automatic retries and fallbacks via gateway
- Can bypass gateway for local testing (`AI_GATEWAY_ENABLED=false`)
- Gateway automatically handles string model IDs when `AI_GATEWAY_API_KEY` is set

**Gateway Benefits:**

- **Unified API**: Same interface for all providers
- **High Reliability**: Automatic retries if provider fails
- **Zero Markup**: No additional cost beyond provider pricing
- **Observability**: Built-in monitoring and analytics
- **Load Balancing**: Distribute requests across providers
- **Fallbacks**: Automatic failover to backup models

**Usage:**

```typescript
import { getAIModel, getDefaultModel } from "@intelligence/client"; // Import via path alias

// Get specific model using provider/model format (recommended)
const model = getAIModel("openai/gpt-5-nano");

// Get default/recommended model
const defaultModel = getDefaultModel();

// Use in server actions
import { generateText } from "intelligence";
import { getAIModel } from "@intelligence/client";

// Using provider/model format
const result = await generateText({
  model: getAIModel("anthropic/claude-sonnet-4.5"),
  prompt: "Hello!",
});

// Legacy format still works (looks up in models.config.json)
const legacyModel = getAIModel("gpt-5-nano");
```

### 3. Base Task (`tasks/base.ts`)

Abstract class that all tasks extend. Provides automatic infrastructure.

```typescript
export abstract class BaseTask<TInput, TOutput> implements Task<TInput, TOutput> {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: z.ZodSchema<TInput>;
  abstract outputSchema: z.ZodSchema<TOutput>;

  defaultConfig: TaskConfig = {
    model: 'google/gemini-3-flash',
    temperature: 0.7,
    maxTokens: 500,
    retries: 3,
  };

  async execute(input: TInput, config?: Partial<TaskConfig>): Promise<TaskResult<TOutput>> {
    // 1. Validate input (Zod)
    // 2. Execute with retry
    // 3. Validate output (Zod)
    // 4. Track cost
    // 5. Return with metadata
  }

  protected abstract executeTask(input: TInput, config: TaskConfig): Promise<...>;
}
```

**Automatic Features:**

- ✅ Input validation (Zod)
- ✅ Output validation (Zod)
- ✅ Cost tracking
- ✅ Retry logic
- ✅ Error handling
- ✅ Logging
- ✅ Metadata (duration, tokens, cost)

**Task Implementation Pattern:**

```typescript
export class MyTask extends BaseTask<MyInput, MyOutput> {
  name = 'my-task';
  description = 'What this task does';
  inputSchema = MyInputSchema;
  outputSchema = MyOutputSchema;

  protected async executeTask(input: MyInput, config: TaskConfig) {
    // Your AI logic here
    const result = await generateText({ ... });
    return { data: ..., usage: result.usage };
  }
}
```

### 4. Input Validation (`Zod Schemas`)

Every task defines Zod schemas for input and output validation.

**Purpose:**

- Runtime type safety (TypeScript alone can't validate runtime data)
- Clear validation errors for debugging
- Prevent invalid data from reaching AI (saves money)
- Validate AI output matches expected structure

**Pattern:**

```typescript
// types.ts
import { z } from "zod";

export const MyInputSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
  optionalField: z.string().optional(),
});

export type MyInput = z.infer<typeof MyInputSchema>;

export const MyOutputSchema = z.object({
  result: z.string().min(1).max(200),
  confidence: z.number().min(0).max(1).optional(),
});

export type MyOutput = z.infer<typeof MyOutputSchema>;
```

**Validation Flow:**

1. Input validated before AI call → catches errors early
2. Output validated after AI call → ensures quality
3. Validation errors logged and returned in TaskResult

### 5. Caching

Two levels of caching work together to optimize performance and costs:

#### A. Provider-Level Prompt Caching (Automatic)

**System Message Caching:**

- OpenAI and Anthropic automatically cache identical system messages server-side
- When the same system prompt is used across multiple requests, providers cache it
- **No explicit tagging needed** - this happens automatically at the provider level
- Reduces token costs for system messages on subsequent requests

**How It Works:**

```typescript
// First request: System message sent, provider caches it
const result1 = await generateText({
  system: getSystemPrompt(), // ~200 tokens
  prompt: "Category: Pizza Restaurant",
});

// Second request: System message is cached, only user prompt sent
const result2 = await generateText({
  system: getSystemPrompt(), // Cached! Only ~50 tokens charged
  prompt: "Category: Bakery",
});
```

**Benefits:**

- ✅ Automatic - no code changes needed
- ✅ Server-side - handled by provider
- ✅ Cost savings - system message tokens cached
- ✅ Works with Vercel AI Gateway

### 6. Cost Tracking (`utilities/cost.ts`)

Automatic cost calculation and logging for all AI operations using `models.config.json`.

**Why Local Calculation?**

Vercel AI Gateway does not provide a REST API to retrieve pricing programmatically. Pricing is only available in the dashboard UI. Therefore, we:

1. Maintain pricing data in `models.config.json` (manually updated from provider websites)
2. Use the `usage` field returned by the AI SDK (contains token counts)
3. Calculate costs locally using our pricing data

This approach provides immediate cost tracking without additional API calls.

**Implementation:**

```typescript
import { calculateCost, getModelConfig } from "./models";
// Import from packages/logger
import { serverLogger as logger, logCost } from "logger";

export function trackCost(
  usage: { promptTokens: number; completionTokens: number },
  modelId: string,
  taskName?: string
): number {
  // Calculate cost from models.config.json
  // The usage object comes from the AI SDK's response.usage field
  const cost = calculateCost(modelId, usage);

  // Get model metadata
  const model = getModelConfig(modelId);

  // Log cost with details (adjust logger interface as needed)
  logCost(`AI generation: $${cost.toFixed(6)}`, {
    model: modelId,
    modelName: model?.name || modelId,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.promptTokens + usage.completionTokens,
    costUsd: cost,
    pricingVerified: model?.pricing.lastVerified,
    taskName,
  });

  return cost;
}
```

**Logged Information:**

- Model used
- Prompt tokens
- Completion tokens
- Total tokens
- Cost in USD
- Task name (from context)

**Benefits:**

- Track spending per operation
- Identify expensive operations
- Budget planning
- Cost attribution

### 7. Logging

All AI operations are automatically logged using your logger infrastructure.

**Integration Points:**

- Task start/end logged by BaseTask
- Costs logged by `utilities/cost.ts` using `logCost`
- Errors logged by BaseTask error handler
- Metadata included in all logs

**Log Levels:**

- `info` - Task execution start/success
- `error` - Task failures, validation errors
- `debug` - Retry attempts, detailed execution flow
- Cost logger - All token usage and costs

**Pattern:**

```typescript
// Adjust import path to match your logger setup
import { logger, logCost } from "@/your-logger";

logger.info("Task started", { taskName, input });
logCost("AI generation cost: $0.000123", { model, tokensUsed, costUsd });
logger.error("Task failed", { taskName, error });
```

### 8. Retry Logic (`utilities/retry.ts`)

Automatic retry with exponential backoff for transient failures.

**Features:**

- Exponential backoff (100ms, 200ms, 400ms, ...)
- Max retries configurable per task
- Retry on specific errors (rate limits, network issues)
- Don't retry on permanent errors (invalid input, auth failures)

**Implementation:**

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelay = options.baseDelayMs ?? 100;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      logger.debug(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
        { error }
      );
      await sleep(delay);
    }
  }

  throw new Error("Retry logic error"); // Should never reach
}

function isRetryableError(error: any): boolean {
  // Rate limit errors
  if (error.status === 429) return true;
  // Network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") return true;
  // Server errors
  if (error.status >= 500 && error.status < 600) return true;
  return false;
}
```

**Retried Errors:**

- 429 Rate Limit Exceeded
- 500-599 Server Errors
- Network timeouts
- Connection resets

**Not Retried:**

- 400 Bad Request (validation errors)
- 401 Unauthorized (invalid API key)
- 403 Forbidden (permissions)
- 404 Not Found

### 9. Task Registry (`packages/intelligence/source/tasks/registry.ts`)

Centralized registry for task discovery and runtime execution.

**Important:** The registry is app-specific. Each app maintains its own registry of tasks. Tasks registered in `apps/{app}/intelligence/tasks/` are only available to that specific app.

**Purpose:**

- Discover available tasks programmatically (within an app)
- Execute tasks by name (for API/CLI)
- List tasks with metadata
- Enable dynamic task selection in UI

**Implementation:**

```typescript
export class TaskRegistry {
  private static tasks = new Map<string, Task<any, any>>();

  static register<T extends Task<any, any>>(task: T) {
    this.tasks.set(task.name, task);
  }

  static get(name: string): Task<any, any> | undefined {
    return this.tasks.get(name);
  }

  static list(): Array<{ name: string; description: string }> {
    return Array.from(this.tasks.values()).map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }

  static async execute<TInput, TOutput>(
    name: string,
    input: TInput,
    config?: Partial<TaskConfig>
  ): Promise<TaskResult<TOutput>> {
    const task = this.get(name);
    if (!task) {
      return { success: false, error: `Task "${name}" not found` };
    }
    return task.execute(input, config);
  }
}
```

**Auto-Registration:**

```typescript
// tasks/index.ts
import { MyTask } from "./my-task";
import { TaskRegistry } from "./registry";

// Auto-register on import
TaskRegistry.register(new MyTask());

export * from "./my-task";
```

**Usage Examples:**

```typescript
// List all tasks
const tasks = TaskRegistry.list();
// => [{ name: 'my-task', description: '...' }]

// Get task by name
const task = TaskRegistry.get("my-task");

// Execute by name (useful for API/CLI)
const result = await TaskRegistry.execute("my-task", input);
```

**Benefits:**

- API endpoint: `POST /api/ai/tasks/execute?task=my-task`
- CLI command: `npm run tools ai-generate -- --task my-task`
- UI dropdown: Show all available tasks
- Testing: Enumerate and test all tasks

## Task Structure

### Self-Contained Task Pattern

Each task is a directory containing everything it needs, located in the app that uses it:

```
apps/{app}/intelligence/tasks/my-task/  # App-specific task
├── index.ts       # Task implementation (extends BaseTask)
├── prompt.ts      # Versioned prompt templates
└── types.ts       # Input/output types with Zod schemas
```

**Why This Pattern:**

- **Isolation**: Changes to one task don't affect others
- **Discoverability**: Everything for a task is in one place
- **Maintainability**: Easy to understand, test, and modify
- **Scalability**: Add new tasks without touching existing code

### Task Implementation Template

```typescript
// types.ts
import { z } from "zod";

export const MyInputSchema = z.object({
  field1: z.string().min(1, "Field1 is required"),
  field2: z.number().positive("Field2 must be positive"),
  optionalField: z.string().optional(),
});

export type MyInput = z.infer<typeof MyInputSchema>;

export const MyOutputSchema = z.object({
  result: z.string().min(1).max(500),
});

export type MyOutput = z.infer<typeof MyOutputSchema>;

// prompt.ts
export const PROMPTS = {
  v1: {
    system: "You are an expert...",
    user: (input: MyInput) => `Generate... ${input.field1}`,
  },
  current: "v1",
};

export function getSystemPrompt(version = PROMPTS.current) {
  return PROMPTS[version].system;
}

export function getUserPrompt(input: MyInput, version = PROMPTS.current) {
  return PROMPTS[version].user(input);
}

// index.ts
import { BaseTask } from "../base";
import { generateText } from "intelligence";
import { getAIModel } from "@intelligence/client";
import { MyInputSchema, MyOutputSchema, MyInput, MyOutput } from "./types";
import { getSystemPrompt, getUserPrompt } from "./prompt";
import type { TaskConfig } from "../types";

export class MyTask extends BaseTask<MyInput, MyOutput> {
  name = "my-task";
  description = "Description of what this task does";
  inputSchema = MyInputSchema;
  outputSchema = MyOutputSchema;

  protected async executeTask(input: MyInput, config: TaskConfig) {
    const result = await generateText({
      model: getAIModel(config.model),
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      system: getSystemPrompt(),
      prompt: getUserPrompt(input),
    });

    return {
      data: JSON.parse(result.text),
      usage: result.usage,
    };
  }
}

// Export convenience function
export const executeMyTask = (input: MyInput, config?: Partial<TaskConfig>) =>
  new MyTask().execute(input, config);
```

## Validation

### Input Validation

Validates inputs before AI calls to catch errors early.

**Pattern:**

```typescript
export const InputSchema = z.object({
  categoryName: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name too long"),
  groupName: z.string().min(1),
  optionalField: z.string().optional(),
});
```

**Benefits:**

- Catches invalid data before expensive AI calls
- Clear error messages for debugging
- Type safety at runtime (not just compile time)
- Prevents API errors from bad input

**Validation Flow:**

```
User Input → Zod Validation → Pass → AI Call
                ↓
              Fail → Return Error (no AI call)
```

### Output Validation

Validates AI output to ensure quality and structure.

**Pattern:**

```typescript
export const OutputSchema = z.object({
  tagline: z.string().min(10, "Tagline too short").max(100, "Tagline too long"),
  description: z
    .string()
    .min(50, "Description too short")
    .max(500, "Description too long"),
});
```

**Benefits:**

- Ensures AI output matches expected format
- Catches malformed responses
- Validates constraints (length, format)
- Fails fast if AI returns bad data

**Validation Flow:**

```
AI Response → Parse JSON → Zod Validation → Pass → Return Data
                                ↓
                              Fail → Return Error + Log Raw Response
```

## Cost Tracking

### Automatic Tracking

All AI calls are automatically tracked and logged.

**What's Tracked:**

- Model used
- Prompt tokens (input)
- Completion tokens (output)
- Total tokens
- Cost in USD
- Task name

**Logged Output:**

```
💰 [COST] AI generation: $0.000123
{
  "model": "gpt-4o-mini",
  "promptTokens": 250,
  "completionTokens": 100,
  "totalTokens": 350,
  "costUsd": 0.000123,
  "taskName": "my-task"
}
```

**Metadata in TaskResult:**

```typescript
{
  success: true,
  data: { ... },
  metadata: {
    tokensUsed: 350,
    costUsd: 0.000123,
    durationMs: 1234,
  }
}
```

### Bulk Operation Costs

Server actions aggregate costs for bulk operations:

```typescript
export async function generateAllMissing() {
  let totalCost = 0;

  for (const item of items) {
    const result = await generateItem(item.id);
    if (result.metadata?.costUsd) {
      totalCost += result.metadata.costUsd;
    }
  }

  logger.info('Bulk generation completed', {
    total: items.length,
    totalCost: totalCost.toFixed(4),
  });

  return { totalCost, ... };
}
```

## Retry Logic

### Exponential Backoff

Automatically retries transient failures with increasing delays.

**Default Behavior:**

- Max retries: 3
- Base delay: 100ms
- Backoff: Exponential (100ms, 200ms, 400ms, 800ms)

**Retry Flow:**

```
Attempt 1 → Fail (429 Rate Limit)
  ↓
Wait 100ms → Attempt 2 → Fail (503 Server Error)
  ↓
Wait 200ms → Attempt 3 → Fail (Timeout)
  ↓
Wait 400ms → Attempt 4 → Success
```

**Configuration:**

```typescript
defaultConfig: TaskConfig = {
  retries: 3, // Max retry attempts
  baseDelayMs: 100, // Base delay for backoff
};
```

**Retryable Errors:**

- 429 Rate Limit Exceeded
- 500-599 Server Errors
- ECONNRESET, ETIMEDOUT (network)

**Non-Retryable Errors:**

- 400 Bad Request (fix input)
- 401 Unauthorized (fix API key)
- 403 Forbidden (fix permissions)

## Task Registry

### Purpose

Centralized registry for runtime task discovery and execution.

**Use Cases:**

1. **API Endpoints**: Execute tasks by name via API
2. **CLI Commands**: Run tasks from command line
3. **Admin UI**: Show available tasks in dropdown
4. **Testing**: Enumerate and test all tasks
5. **Monitoring**: Track which tasks are registered

### API Integration

**Endpoint Pattern:**

```typescript
// apps/web/app/api/ai/tasks/execute/route.ts
import { TaskRegistry } from "@intelligence/tasks/registry"; // Import via path alias
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { taskName, input, config } = await request.json();

  const result = await TaskRegistry.execute(taskName, input, config);

  return NextResponse.json(result);
}
```

**Usage:**

```bash
# Execute a task
curl -X POST http://localhost:3000/api/ai/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskName": "my-task",
    "input": { "field1": "value1", "field2": 123 }
  }'
```

**Note:** Tasks are app-specific. The registry only contains tasks registered by the app that imports them. Each app has its own task registry.

### CLI Integration

```typescript
// tools/app/commands/ai-generate.ts
import { TaskRegistry } from "@intelligence/tasks/registry"; // Import via path alias
import { serverLogger as logger } from "logger";

export async function runAiGenerate(options: { task: string; input: string }) {
  const input = JSON.parse(options.input);
  const result = await TaskRegistry.execute(options.task, input);

  if (result.success) {
    logger.info("Generation successful", result.data);
  } else {
    logger.error("Generation failed", { error: result.error });
  }
}
```

**Usage:**

```bash
# Execute a task via CLI (tasks must be registered in the CLI app)
npm run tools ai-generate --task my-task --input '{"field1":"value1"}'
```

**Note:** Tasks are app-specific. The CLI tool can only execute tasks that are registered in `apps/{app}/intelligence/tasks/`.

## Prompt Versioning

### Why Version Prompts

- **Iteration**: Improve prompts without losing old versions
- **A/B Testing**: Compare v1 vs v2 performance
- **Rollback**: Revert to previous version if needed
- **History**: Track what changed and when

### Pattern

```typescript
// prompt.ts
export const PROMPTS = {
  v1: {
    system: "You are a helpful assistant...",
    user: (input: Input) => `Generate...`,
  },
  v2: {
    system: "You are an expert copywriter...", // Improved
    user: (input: Input) => `Create compelling...`, // More specific
  },
  current: "v2", // Active version
};

export function getSystemPrompt(version: string = PROMPTS.current) {
  const prompts = PROMPTS[version as keyof typeof PROMPTS];
  if (!prompts) {
    throw new Error(`Prompt version "${version}" not found`);
  }
  return prompts.system;
}

export function getUserPrompt(input: Input, version: string = PROMPTS.current) {
  const prompts = PROMPTS[version as keyof typeof PROMPTS];
  if (!prompts) {
    throw new Error(`Prompt version "${version}" not found`);
  }
  return prompts.user(input);
}
```

### A/B Testing

```typescript
// Test v1 vs v2
const resultV1 = await task.execute(input, { promptVersion: "v1" });
const resultV2 = await task.execute(input, { promptVersion: "v2" });

// Compare quality, cost, performance
```

## Task Types

### TaskResult

Standard result type for all tasks:

```typescript
export interface TaskResult<T> {
  success: boolean; // Did the task succeed?
  data?: T; // Output data (if success)
  error?: string; // Error message (if failure)
  metadata?: {
    tokensUsed?: number; // Total tokens consumed
    costUsd?: number; // Cost in USD
    durationMs?: number; // Execution time
    model?: string; // Model used
    retries?: number; // Number of retry attempts
    costTrackingFailed?: boolean; // Cost tracking failed
  };
}
```

### TaskConfig

Configuration options for task execution:

```typescript
export interface TaskConfig {
  model: string; // 'gpt-4o-mini', 'gpt-4o'
  temperature?: number; // 0.0-2.0 (creativity)
  maxTokens?: number; // Max output tokens
  retries?: number; // Max retry attempts
  promptVersion?: string; // Prompt version to use
}
```

### Task Interface

```typescript
export interface Task<TInput, TOutput> {
  name: string; // Unique task identifier
  description: string; // Human-readable description
  inputSchema: z.ZodSchema<TInput>; // Input validation schema
  outputSchema: z.ZodSchema<TOutput>; // Output validation schema
  defaultConfig: TaskConfig; // Default configuration
  execute( // Main execution method
    input: TInput,
    config?: Partial<TaskConfig>
  ): Promise<TaskResult<TOutput>>;
}
```

## Adding New Tasks

### Step-by-Step Guide

**1. Create Task Directory**

Choose the appropriate app for your task:

```bash
mkdir -p apps/{app}/intelligence/tasks/my-new-task
```

**2. Define Types with Zod Schemas**

```typescript
// apps/{app}/intelligence/tasks/my-new-task/types.ts
import { z } from "zod";

export const MyInputSchema = z.object({
  requiredField: z.string().min(1),
  optionalField: z.number().optional(),
});

export type MyInput = z.infer<typeof MyInputSchema>;

export const MyOutputSchema = z.object({
  result: z.string().min(1).max(1000),
});

export type MyOutput = z.infer<typeof MyOutputSchema>;
```

**3. Create Prompts**

```typescript
// apps/{app}/intelligence/tasks/my-new-task/prompt.ts
import type { MyInput } from "./types";

export const PROMPTS = {
  v1: {
    system: "You are an expert...",
    user: (input: MyInput) => `Generate ${input.requiredField}...`,
  },
  current: "v1",
};

export function getSystemPrompt(version = PROMPTS.current) {
  return PROMPTS[version].system;
}

export function getUserPrompt(input: MyInput, version = PROMPTS.current) {
  return PROMPTS[version].user(input);
}
```

**4. Implement Task**

```typescript
// apps/{app}/intelligence/tasks/my-new-task/index.ts
import { BaseTask } from "@intelligence/tasks/base"; // Import via path alias
import { generateText } from "intelligence";
import { getAIModel } from "@intelligence/client"; // Import via path alias
import type { TaskConfig } from "@intelligence/tasks/types"; // Import via path alias
import { MyInputSchema, MyOutputSchema, MyInput, MyOutput } from "./types";
import { getSystemPrompt, getUserPrompt } from "./prompt";

export class MyTask extends BaseTask<MyInput, MyOutput> {
  name = "my-task";
  description = "What my task does";
  inputSchema = MyInputSchema;
  outputSchema = MyOutputSchema;

  protected async executeTask(input: MyInput, config: TaskConfig) {
    const result = await generateText({
      model: getAIModel(config.model),
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      system: getSystemPrompt(),
      prompt: getUserPrompt(input),
    });

    const parsedData = JSON.parse(result.text);

    return {
      data: parsedData,
      usage: result.usage,
    };
  }
}

// Export convenience function
export const executeMyTask = (input: MyInput, config?: Partial<TaskConfig>) =>
  new MyTask().execute(input, config);
```

**5. Export and Register**

```typescript
// apps/{app}/intelligence/tasks/index.ts
export * from "./my-new-task";
import { MyTask } from "./my-new-task";
import { TaskRegistry } from "@intelligence/tasks/registry"; // Import via path alias

// Auto-register on import
TaskRegistry.register(new MyTask());
```

**Done!** New task automatically has:

- ✅ Input validation
- ✅ Output validation
- ✅ Caching
- ✅ Cost tracking
- ✅ Retry logic
- ✅ Error handling
- ✅ Logging
- ✅ Registry entry

## Usage Examples

### Basic Task Execution

```typescript
// Import from your app's tasks
import { executeMyTask } from "@/intelligence/tasks"; // or from your configured path alias

const result = await executeMyTask({
  requiredField: "value1",
  optionalField: 123,
});

if (result.success) {
  console.log(result.data.result);
  console.log(`Cost: $${result.metadata.costUsd}`);
} else {
  console.error(result.error);
}
```

### With Custom Configuration

```typescript
const result = await executeMyTask(
  {
    requiredField: "value1",
  },
  {
    model: "gpt-4o", // Upgrade to better model
    temperature: 0.9, // More creative
    maxTokens: 1000, // Longer output
  }
);
```

### Server Action Integration

```typescript
// Server action in apps/web/app/actions/generate.ts (or similar)
"use server";

import { executeMyTask } from "@/intelligence/tasks"; // Import from app's tasks
import { getItemById, updateItem } from "database";

export async function generateItem(itemId: number) {
  // Your database access here
  const item = await getItemById(itemId);
  if (!item) {
    return { success: false, error: "Item not found" };
  }

  const result = await executeMyTask({
    requiredField: item.name,
  });

  if (result.success) {
    // Save to database
    await updateItem(itemId, {
      generatedText: result.data.result,
    });
  }

  return result;
}
```

### Bulk Operations with Rate Limiting

```typescript
export async function generateAllMissing() {
  const items = await getAllItems();
  const missing = items.filter((i) => !i.generatedText);

  const results = {
    total: missing.length,
    successful: 0,
    failed: 0,
    totalCost: 0,
    errors: [] as string[],
  };

  for (const item of missing) {
    const result = await generateItem(item.id);

    if (result.success) {
      results.successful++;
      results.totalCost += result.metadata?.costUsd || 0;
    } else {
      results.failed++;
      results.errors.push(`${item.name}: ${result.error}`);
    }

    // Rate limiting: 1 second delay between calls
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  logger.info("Bulk generation completed", results);
  return results;
}
```

## Configuration

### Environment Variables

Required in `.env`:

```bash
# Vercel AI Gateway API key (get from Vercel dashboard)
# Go to Settings → AI → Gateway → API keys → Create key
AI_GATEWAY_API_KEY=your-gateway-api-key

# Optional: Provider API keys for BYOK (Bring Your Own Key)
# If not set, uses Vercel's managed keys
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

Optional:

```bash
# Override default model (use provider/model format)
# Default is google/gemini-3-flash (recommended model)
AI_DEFAULT_MODEL=google/gemini-3-flash

# Override default temperature
AI_DEFAULT_TEMPERATURE=0.7

# Disable gateway (for local testing)
AI_GATEWAY_ENABLED=false
```

**Getting Your AI Gateway API Key:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to Settings → AI → Gateway → API keys
4. Click "Create key" and copy the API key
5. Add to `.env` as `AI_GATEWAY_API_KEY`

**BYOK (Bring Your Own Key):**

- If you provide `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, the gateway uses your keys
- If not provided, Vercel manages keys for you (still 0% markup)
- BYOK gives you direct billing from providers
- Managed keys simplify setup and key rotation

### Model Selection

All available models are defined in `packages/intelligence/models.config.json`.

**Model Format:**

- Use `provider/model` format (e.g., `openai/gpt-5-nano`) - recommended
- Legacy format: model key from config (e.g., `gpt-5-nano`) still supported

**OpenAI Models:**

- `openai/gpt-5-nano` - Cheapest, excellent value
  - $0.05/1M input, $0.40/1M output tokens
  - Supports streaming, function calling, vision, JSON mode, web search
  - 400K context window
  - Cache read: $0.01/1M tokens
- `openai/gpt-5-chat` - High-quality chat model with excellent reasoning
  - $1.25/1M input, $10.00/1M output tokens
  - 128K context window
  - Supports streaming, function calling, vision, JSON mode, web search
  - Best for most production use cases

**Anthropic Models (via Gateway):**

- `anthropic/claude-sonnet-4.5` - High-quality reasoning (best quality)
  - $3.00/1M input, $15.00/1M output tokens
  - 200K context window
  - Cache read: $0.30/1M, cache write: $3.75/1M tokens
  - Supports web search
  - Best for complex tasks requiring superior quality

**Google Models (via Gateway):**

- `google/gemini-3-flash` - **Recommended default** - Fast and efficient
  - $0.50/1M input, $3.00/1M output tokens
  - 1M context window
  - Supports streaming, function calling, vision, JSON mode
  - Good balance of speed and cost
- `google/gemini-2.5-flash-lite` - Very cost-effective, large context
  - $0.10/1M input, $0.40/1M output tokens
  - 1.049M context window (largest!)
  - Best for tasks requiring extensive context

**xAI Models (via Gateway):**

- `xai/grok-code-fast-1` - Optimized for coding workflows
  - $0.20/1M input, $0.50/1M output tokens
  - 256K context window
  - Excellent for code generation and debugging
- `xai/grok-4.1-fast-non-reasoning` - Fast, high-context for non-reasoning tasks
  - $0.20/1M input, $0.50/1M output tokens
  - 2M context window (extremely large!)
  - Best for large context processing and quick responses

**Choosing a Model:**

- **Default/Recommended**: `google/gemini-3-flash` (balanced speed and cost)
- **Cost-optimized**: `openai/gpt-5-nano` (cheapest)
- **Quality-optimized**: `anthropic/claude-sonnet-4.5` (best quality)
- **Large context**: `google/gemini-2.5-flash-lite` or `xai/grok-4.1-fast-non-reasoning`
- **Coding tasks**: `xai/grok-code-fast-1`
- Check capabilities before use: `supportsCapability(modelId, 'vision')`
- Override per call for specific needs

**Fallback Chains:**
The gateway supports automatic fallbacks if a model fails (configured in `models.config.json`):

```json
{
  "fallbackChains": {
    "cost-optimized": ["openai/gpt-5-nano"],
    "quality-optimized": ["openai/gpt-5-chat", "anthropic/claude-sonnet-4.5"],
    "balanced": [
      "google/gemini-3-flash",
      "openai/gpt-5-nano",
      "anthropic/claude-sonnet-4.5"
    ]
  }
}
```

**Programmatic Selection:**

```typescript
import {
  getRecommendedModel,
  getModelsByCapability,
  getModelConfig,
} from "@intelligence/utilities/models"; // Import via path alias

// Get recommended model (currently gemini-3-flash)
const model = getRecommendedModel();
console.log(
  `Recommended: ${model.name} (${model.provider}/${model.apiIdentifier})`
);

// Get models that support vision
const visionModels = getModelsByCapability("vision");
console.log(`Vision models: ${visionModels.map((m) => m.name).join(", ")}`);

// Compare costs across providers
const gpt5Nano = getModelConfig("openai/gpt-5-nano");
const gemini3Flash = getModelConfig("google/gemini-3-flash");
console.log(`GPT-5 Nano: $${gpt5Nano.pricing.outputCostPer1MTokens}/1M output`);
console.log(
  `Gemini 3 Flash: $${gemini3Flash.pricing.outputCostPer1MTokens}/1M output`
);

// Get all active models from all providers
const activeModels = getActiveModels();
console.log(`Available models: ${activeModels.map((m) => m.name).join(", ")}`);
```

### Temperature Settings

- `0.0-0.3` - Deterministic, factual (summaries, data extraction)
- `0.4-0.7` - Balanced (default, general use)
- `0.8-1.2` - Creative (marketing copy, brainstorming)
- `1.3-2.0` - Highly creative (experimental)

## Monitoring & Debugging

### Logging

All AI operations are automatically logged using your logger infrastructure.

**Log Levels:**

- `info` - Task start, success
- `error` - Task failures, validation errors, retry exhaustion
- `debug` - Retry attempts, detailed execution flow
- Cost logger - All costs and token usage

### Debugging Tips

**Enable Debug Logging:**

```typescript
// Adjust import path to match your logger
import { serverLogger as logger } from "logger"; // Import from packages/logger
logger.level = "debug";
```

**Test Without AI:**

```typescript
// Mock the executeTask method for testing
class MyTaskTest extends MyTask {
  protected async executeTask(input: MyInput, config: TaskConfig) {
    return {
      data: { result: "mock result" },
      usage: { promptTokens: 10, completionTokens: 5 },
    };
  }
}
```

## Error Handling

### Error Types

**Validation Errors:**

```typescript
{
  success: false,
  error: "Validation failed: field1 is required"
}
```

**API Errors:**

```typescript
{
  success: false,
  error: "OpenAI API error: Rate limit exceeded (429)"
}
```

**Parsing Errors:**

```typescript
{
  success: false,
  error: "Failed to parse AI response as JSON"
}
```

### Error Flow

```
Task Start
  ↓
Input Validation → Fail → Return Error
  ↓ Pass
Execute AI Call → Fail → Retry → Fail → Return Error
  ↓ Success
Parse Response → Fail → Return Error
  ↓ Success
Output Validation → Fail → Return Error
  ↓ Pass
Track Cost → Return Success
```

### Graceful Degradation

Tasks never throw exceptions; they return structured errors:

```typescript
const result = await task.execute(input);

if (result.success) {
  // Use result.data
} else {
  // Show result.error to user
  // Log for debugging
}
```

## Best Practices

### 1. Keep Tasks Pure

- Input → AI → Output
- No side effects (database, file system)
- Caller handles database operations

### 2. Validate Everything

- Input validation catches errors early
- Output validation ensures quality
- Use Zod for both

### 3. Log Costs

- Track all AI spending
- Use cost logger for visibility
- Include in TaskResult metadata

### 4. Handle Errors Gracefully

- Always check result.success
- Never throw from tasks
- Set appropriate TTL

### 5. Version Prompts

- Track changes
- Enable rollback
- Support A/B testing

### 6. Handle Errors Gracefully

- Return structured errors
- Log for debugging
- Show user-friendly messages

### 7. Test Thoroughly

- Unit test prompts with fixtures
- Integration test with mock responses
- Test error cases

### 8. Monitor Performance

- Track token usage
- Monitor costs
- Measure latency

## Testing

### Unit Testing Prompts

```typescript
describe("My Task Prompts", () => {
  it("builds system prompt", () => {
    const prompt = getSystemPrompt("v1");
    expect(prompt).toContain("expert");
  });

  it("builds user prompt with input", () => {
    const prompt = getUserPrompt({
      requiredField: "test",
    });
    expect(prompt).toContain("test");
  });
});
```

### Integration Testing Tasks

```typescript
describe("MyTask", () => {
  it("validates input", async () => {
    const task = new MyTask();
    const result = await task.execute({
      requiredField: "", // Invalid
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("requiredField");
  });

  it("generates text (integration)", async () => {
    const task = new MyTask();
    const result = await task.execute({
      requiredField: "test value",
    });

    expect(result.success).toBe(true);
    expect(result.data?.result).toBeTruthy();
    expect(result.metadata?.costUsd).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### API Key Issues

**Symptom:** `AI_GATEWAY_API_KEY environment variable is not set`
**Solution:** Add key to `.env` file

**Symptom:** `401 Unauthorized`
**Solution:** Check API key is valid, not expired

### Rate Limits

**Symptom:** `429 Rate Limit Exceeded`
**Solution:** Retry logic handles this automatically. For bulk operations, add delay between calls.

### Validation Errors

**Symptom:** `Validation failed: ...`
**Solution:** Check input matches Zod schema requirements

**Symptom:** AI output validation fails
**Solution:** Prompt may not be clear enough; improve prompt or relax output schema

## Future Enhancements

### Streaming Support

For longer generations, stream results:

```typescript
export async function* executeStream(input: MyInput): AsyncIterable<string> {
  const stream = await streamText({
    model: getAIModel("gpt-4o-mini"),
    prompt: getUserPrompt(input),
  });

  for await (const chunk of stream.textStream) {
    yield chunk;
  }
}
```

### Persistent Caching (Future)

For production, consider implementing Redis or database caching if needed:

```typescript
// Example: Cache to database instead of memory
export async function getCached(
  taskName: string,
  input: any
): Promise<T | null> {
  const key = createCacheKey(taskName, input);
  return await redis.get(key);
}
```

### Task Chains

Compose tasks into pipelines:

```typescript
const pipeline = TaskPipeline.create()
  .add(extractKeywordsTask)
  .add(generateDescriptionTask)
  .add(reviewContentTask);

const result = await pipeline.execute(input);
```

### Background Jobs

For long-running bulk operations:

```typescript
export async function queueBulkGeneration(itemIds: number[]) {
  await queue.add("bulk-generation", { itemIds });
  return { jobId: "..." };
}
```

## Model Configuration Maintenance

### Updating Pricing

**Important:** Since Vercel AI Gateway doesn't provide a pricing API, we manually maintain pricing in `models.config.json`. When OpenAI or other providers update pricing:

1. Check the provider's pricing page (see `providers[].pricingUrl` in config)
2. Open `packages/intelligence/models.config.json`
3. Update `pricing.inputCostPer1MTokens` and `pricing.outputCostPer1MTokens`
4. Update `pricing.lastVerified` to today's date
5. Verify calculations are correct (pricing is per 1M tokens, so divide by 1,000,000)
6. Run cost tracking tests to ensure calculations are correct

**Note:** Provider pricing changes are typically announced in advance, so you can update the config proactively. The `lastVerified` field helps track when pricing was last checked.

**Example:**

```json
{
  "pricing": {
    "currency": "USD",
    "inputCostPer1MTokens": 0.2, // Updated
    "outputCostPer1MTokens": 0.8, // Updated
    "lastVerified": "2025-12-15" // Updated
  }
}
```

### Adding New Models

1. Add model to `packages/intelligence/models.config.json`:

```json
{
  "models": {
    "new-model": {
      "name": "New Model",
      "provider": "openai",
      "apiIdentifier": "new-model",
      "description": "Description of capabilities",
      "status": "active",
      "pricing": { ... },
      "capabilities": { ... },
      "defaultSettings": { ... },
      "limits": { ... },
      "recommended": false
    }
  }
}
```

2. No code changes needed! The model is immediately available via:
   - `getModelConfig('new-model')`
   - `calculateCost('new-model', usage)`
   - Task execution: `{ model: 'new-model' }`

### Adding New Providers

When adding providers beyond OpenAI (e.g., Anthropic, Cohere):

1. Add provider to `packages/intelligence/models.config.json`:

```json
{
  "providers": {
    "anthropic": {
      "name": "Anthropic",
      "apiKeyEnvVar": "ANTHROPIC_API_KEY",
      "sdkPackage": "@ai-sdk/anthropic",
      "docsUrl": "https://docs.anthropic.com",
      "pricingUrl": "https://www.anthropic.com/api"
    }
  }
}
```

2. Add models from that provider:

```json
{
  "models": {
    "claude-3-5-sonnet": {
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "apiIdentifier": "claude-3-5-sonnet-20241022",
      "status": "active",
      ...
    }
  }
}
```

3. Update `packages/intelligence/source/client.ts` to support multiple providers:

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { createGateway } from "@ai-sdk/gateway";
import { getModelConfig } from "./utilities/models";

export function getAIModel(modelId: string) {
  const config = getModelConfig(modelId);
  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  // Gateway handles all providers automatically
  const gateway = getGatewayProvider();
  return gateway(`${config.provider}/${config.apiIdentifier}`);
}
```

## Vercel AI Gateway Features

### Unified API

Access multiple providers through a single endpoint. Switch between OpenAI, Anthropic, and others with minimal code changes:

```typescript
// Same interface for all providers
const openaiResult = await generateText({ model: getAIModel('openai/gpt-5-nano'), ... });
const claudeResult = await generateText({ model: getAIModel('anthropic/claude-sonnet-4.5'), ... });
const geminiResult = await generateText({ model: getAIModel('google/gemini-3-flash'), ... });
```

### Automatic Retries & Fallbacks

Gateway automatically retries failed requests and can fall back to alternative models:

```typescript
// Gateway automatically retries failed requests
// Configure fallback chains in models.config.json for automatic model fallback
const result = await generateText({
  model: getAIModel("openai/gpt-5-nano"),
  prompt: "Hello",
  // Gateway handles retries automatically
});
```

### Observability & Usage Tracking

Monitor all AI requests in Vercel dashboard:

- Request volume and latency
- Token usage and costs (real-time tracking)
- Error rates and types
- Model performance comparison
- Provider health status
- Budget management and alerts

**Important:** Vercel AI Gateway does **not** provide a REST API to retrieve pricing information programmatically. Pricing is only available through the Vercel dashboard UI.

**Our Approach:**

- We maintain pricing data in `models.config.json` (manually updated from provider websites)
- The AI SDK returns a `usage` field with token counts after each request
- We calculate costs locally using `calculateCost()` based on the pricing in our config
- This gives us immediate cost tracking without needing to query an API
- The Vercel dashboard provides comprehensive analytics and can be used for budget monitoring and historical analysis

**Why This Works:**

- Provider pricing changes infrequently (typically announced in advance)
- Local calculation is faster and doesn't require additional API calls
- We can track costs immediately after each request completes
- The `usage` field from the SDK provides accurate token counts

### Load Balancing

Distribute requests across multiple providers for better reliability and performance.

### Zero Markup

Tokens cost exactly the same as direct from providers (0% markup). You only pay provider costs.

### BYOK Support

Bring Your Own Key for direct billing from providers, or use Vercel's managed keys for simplicity.

## Related Documentation

- [Vercel AI SDK Docs](https://ai-sdk.dev/docs/introduction) - Official AI SDK documentation
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway) - AI Gateway features and setup
- [OpenAI Pricing](https://openai.com/api/pricing/) - Current OpenAI API pricing
- [Anthropic Pricing](https://www.anthropic.com/api) - Current Anthropic API pricing
