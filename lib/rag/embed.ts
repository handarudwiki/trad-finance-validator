/**
 * Text embedding service using Google Generative AI text-embedding-004 model.
 * Generates vector embeddings for RAG queries and regulatory chunk ingestion.
 * Satisfies: Requirements 8.1, 12.1
 */

import { embeddingModel } from '@/lib/gemini'

/**
 * Generate a vector embedding for the given text using text-embedding-004.
 * @param text - The text to embed
 * @returns A 768-dimensional embedding vector
 */
export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}
