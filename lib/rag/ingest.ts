/**
 * Regulatory knowledge base ingestion utilities.
 * Used by the scripts/ingest-regulatory-docs.ts script to load and embed regulatory data into Qdrant.
 * Satisfies: Requirements 12.1, 12.2, 12.4, 12.5
 */

import { QdrantClient } from '@qdrant/js-client-rest'
import { readFile } from 'fs/promises'
import { env } from '@/lib/config'
import type { RegulatoryChunk } from '@/lib/rag/retrieve'

/** Qdrant client initialized with URL from environment */
const qdrant = new QdrantClient({ url: env.QDRANT_URL })

/** Collection name from environment (default: 'regulatory_knowledge') */
const collectionName = env.QDRANT_COLLECTION || 'regulatory_knowledge'

/** Embedding dimension for text-embedding-004 */
const EMBEDDING_DIMENSION = 768

/**
 * Ensure the regulatory_knowledge collection exists in Qdrant.
 * Creates it with 768-dimension cosine distance if not already present.
 * Idempotent — safe to call multiple times.
 *
 * Satisfies: Requirement 12.1
 */
export async function ensureCollection(): Promise<void> {
  const { exists } = await qdrant.collectionExists(collectionName)

  if (!exists) {
    await qdrant.createCollection(collectionName, {
      vectors: {
        size: EMBEDDING_DIMENSION,
        distance: 'Cosine',
      },
    })
  }
}

/**
 * Upsert a regulatory chunk with its embedding vector into Qdrant.
 * Uses the chunk's article field as a deterministic string-based point ID for idempotent updates.
 *
 * @param chunk - The regulatory chunk metadata to store as payload
 * @param vector - The 768-dimensional embedding vector for the chunk
 *
 * Satisfies: Requirements 12.1, 12.2
 */
export async function upsertChunk(chunk: RegulatoryChunk, vector: number[]): Promise<void> {
  await qdrant.upsert(collectionName, {
    wait: true,
    points: [
      {
        id: chunk.article,
        vector,
        payload: {
          source: chunk.source,
          article: chunk.article,
          title: chunk.title,
          text: chunk.text,
          relatedClauses: chunk.relatedClauses,
          applicableTo: chunk.applicableTo,
          documentTypes: chunk.documentTypes,
        },
      },
    ],
  })
}

/**
 * Load and parse a regulatory data JSON file.
 * Expects the file to contain a JSON array of RegulatoryChunk objects.
 *
 * @param filePath - Absolute or relative path to the JSON file
 * @returns Parsed array of RegulatoryChunk objects
 *
 * Satisfies: Requirement 12.4
 */
export async function loadRegDataFile(filePath: string): Promise<RegulatoryChunk[]> {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content) as RegulatoryChunk[]
}
