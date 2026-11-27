/**
 * Shared pgvector column helpers for Child Apps.
 *
 * Drizzle ships native `halfvec` / `vector` types; this module re-exports them
 * so apps have one Prism import path and a documented 1024-d default for the
 * locked text-embedding configuration (see INTELLIGENCE-Prism.md).
 *
 * Apps own enabling the `vector` extension in their migrations.
 */

import {
  halfvec as drizzleHalfvec,
  vector as drizzleVector,
} from "drizzle-orm/pg-core";

/** Locked Matryoshka width for Prism's default text embedding path. */
export const DEFAULT_HALFVEC_DIMENSIONS = 1024;

/**
 * `halfvec(dimensions)` column — preferred for stored embeddings (half the
 * storage of `vector` at the same width).
 *
 * @example
 * ```ts
 * import { halfvec } from "database/vector";
 * embedding: halfvec("embedding", { dimensions: 1024 }),
 * ```
 */
export const halfvec = drizzleHalfvec;

/**
 * Full-precision `vector(dimensions)` column when half precision is unsuitable.
 */
export const vector = drizzleVector;
