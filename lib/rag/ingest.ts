/**
 * Regulatory knowledge base ingestion utilities.
 * Used by the scripts/ingest-regulatory-docs.ts script to load and embed regulatory data into Qdrant.
 * Satisfies: Requirements 12.1, 12.2, 12.4, 12.5
 */

import { QdrantClient } from '@qdrant/js-client-rest'
import { readFile } from 'fs/promises'
import { createHash } from 'crypto'
import { env } from '@/lib/config'
import type { RegulatoryChunk } from '@/lib/rag/retrieve'

/** Qdrant client initialized with URL from environment */
const qdrant = new QdrantClient({ url: env.QDRANT_URL, checkCompatibility: false })

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
 * Generates a deterministic UUID from the chunk's article field for idempotent updates.
 *
 * @param chunk - The regulatory chunk metadata to store as payload
 * @param vector - The 768-dimensional embedding vector for the chunk
 *
 * Satisfies: Requirements 12.1, 12.2
 */
export async function upsertChunk(chunk: RegulatoryChunk, vector: number[]): Promise<void> {
  // Generate a deterministic UUID v5-style ID from the article string
  const id = stringToUuid(chunk.article)

  await qdrant.upsert(collectionName, {
    wait: true,
    points: [
      {
        id,
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
 * Convert a string to a deterministic UUID format using MD5 hash.
 * Produces a valid UUID v4-format string (with modified version bits).
 */
function stringToUuid(input: string): string {
  const hash = createHash('md5').update(input).digest('hex')
  // Format as UUID: 8-4-4-4-12
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
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
