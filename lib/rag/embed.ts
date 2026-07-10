/**
 * Text embedding service using Google GenAI text-embedding-004 model.
 * Generates vector embeddings for RAG queries and regulatory chunk ingestion.
 * Satisfies: Requirements 8.1, 12.1
 */

import { ai, EMBEDDING_MODEL } from '@/lib/gemini'

/**
 * Generate a vector embedding for the given text using text-embedding-004.
 * @param text - The text to embed
 * @returns A 768-dimensional embedding vector
 */
export async function embedText(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  })
  return response.embeddings![0].values!
}
