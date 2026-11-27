import { beforeEach, describe, expect, it, vi } from "vitest";

const embedMock = vi.fn();
const embedManyMock = vi.fn();
const rerankMock = vi.fn();
const embeddingModelMock = vi.fn((id: string) => ({ kind: "embedding", id }));
const rerankingModelMock = vi.fn((id: string) => ({ kind: "reranking", id }));

vi.mock("server-only", () => ({}));

vi.mock("ai", () => ({
  embed: (...args: unknown[]) => embedMock(...args),
  embedMany: (...args: unknown[]) => embedManyMock(...args),
  rerank: (...args: unknown[]) => rerankMock(...args),
}));

vi.mock("@ai-sdk/gateway", () => ({
  createGateway: () => {
    const provider = Object.assign(
      (modelId: string) => ({ kind: "language", id: modelId }),
      {
        embeddingModel: embeddingModelMock,
        rerankingModel: rerankingModelMock,
      }
    );
    return provider;
  },
}));

vi.mock("./utilities/cost", () => ({
  trackCost: vi.fn(() => 0),
}));

describe("embedding client helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    embedMock.mockReset();
    embedManyMock.mockReset();
    rerankMock.mockReset();
    embeddingModelMock.mockClear();
    rerankingModelMock.mockClear();
    process.env.AI_GATEWAY_API_KEY = "test-key";
    process.env.AI_GATEWAY_ENABLED = "true";
    delete process.env.AI_EMBEDDING_MODEL;
    delete process.env.AI_EMBEDDING_QUERY_MODEL;
    delete process.env.AI_EMBEDDING_DIMENSIONS;
    delete process.env.AI_RERANK_MODEL;
  });

  it("reads default embedding model and dimensions from env conventions", async () => {
    const {
      DEFAULT_EMBEDDING_DIMENSIONS,
      DEFAULT_EMBEDDING_MODEL,
      getEmbeddingDimensions,
      getEmbeddingModelId,
    } = await import("./client");

    expect(getEmbeddingModelId("document")).toBe(DEFAULT_EMBEDDING_MODEL);
    expect(getEmbeddingModelId("query")).toBe(DEFAULT_EMBEDDING_MODEL);
    expect(getEmbeddingDimensions()).toBe(DEFAULT_EMBEDDING_DIMENSIONS);

    process.env.AI_EMBEDDING_MODEL = "openai/text-embedding-3-small";
    process.env.AI_EMBEDDING_QUERY_MODEL = "openai/text-embedding-3-large";
    process.env.AI_EMBEDDING_DIMENSIONS = "768";

    expect(getEmbeddingModelId("document")).toBe(
      "openai/text-embedding-3-small"
    );
    expect(getEmbeddingModelId("query")).toBe("openai/text-embedding-3-large");
    expect(getEmbeddingDimensions()).toBe(768);
  });

  it("embedText batches through embedMany and returns dims + model", async () => {
    embedManyMock.mockResolvedValue({
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
      usage: { tokens: 12 },
    });

    const { embedText } = await import("./client");
    const result = await embedText({
      values: ["alpha", "beta"],
      dimensions: 2,
    });

    expect(embedManyMock).toHaveBeenCalledOnce();
    expect(embeddingModelMock).toHaveBeenCalledWith(
      "alibaba/qwen3-embedding-8b"
    );
    expect(result.model).toBe("alibaba/qwen3-embedding-8b");
    expect(result.dimensions).toBe(2);
    expect(result.embeddings).toHaveLength(2);
    expect(result.usage.tokens).toBe(12);
  });

  it("embedText uses embed for a single value", async () => {
    embedMock.mockResolvedValue({
      embedding: [1, 2, 3],
      usage: { tokens: 4 },
    });

    const { embedText } = await import("./client");
    const result = await embedText({ values: "solo" });

    expect(embedMock).toHaveBeenCalledOnce();
    expect(embedManyMock).not.toHaveBeenCalled();
    expect(result.embeddings).toEqual([[1, 2, 3]]);
  });

  it("rerankDocuments requires a configured model and returns ranking", async () => {
    const { rerankDocuments } = await import("./client");

    await expect(
      rerankDocuments({ query: "q", documents: ["a"] })
    ).rejects.toThrow(/AI_RERANK_MODEL/);

    process.env.AI_RERANK_MODEL = "cohere/rerank-v3.5";
    rerankMock.mockResolvedValue({
      ranking: [
        { originalIndex: 1, score: 0.9, document: "b" },
        { originalIndex: 0, score: 0.1, document: "a" },
      ],
      rerankedDocuments: ["b", "a"],
    });

    const result = await rerankDocuments({
      query: "q",
      documents: ["a", "b"],
      topN: 2,
    });

    expect(rerankingModelMock).toHaveBeenCalledWith("cohere/rerank-v3.5");
    expect(result.model).toBe("cohere/rerank-v3.5");
    expect(result.rerankedDocuments).toEqual(["b", "a"]);
    expect(result.ranking[0]?.originalIndex).toBe(1);
  });
});
