/**
 * Regulatory knowledge retrieval service.
 * Queries Qdrant vector store with metadata filters for transaction type and document type.
 * Satisfies: Requirements 8.1, 8.2, 8.3, 12.3
 */

import { QdrantClient } from '@qdrant/js-client-rest'
import { embedText } from '@/lib/rag/embed'
import { env } from '@/lib/config'

/** Qdrant client initialized with URL and API key from environment */
const qdrant = new QdrantClient({ url: env.QDRANT_URL, apiKey: env.QDRANT_API_KEY })

/** Collection name from environment (default: 'regulatory_knowledge') */
const collectionName = env.QDRANT_COLLECTION || 'regulatory_knowledge'

/**
 * A single chunk from the regulatory knowledge base.
 * Satisfies: Requirement 12.2 (metadata per chunk)
 */
export interface RegulatoryChunk {
  source: 'UCP_600' | 'ISBP_745' | 'PBI_SKBDN'
  article: string
  title: string
  text: string
  relatedClauses: string[]
  applicableTo: ('LC' | 'SKBDN' | 'ALL')[]
  documentTypes: string[]
}

/**
 * Retrieve regulatory chunks relevant to a query, filtered by transaction type and optional document type.
 *
 * @param query - The search query text to embed and match against regulatory knowledge
 * @param transactionType - Filter chunks applicable to this transaction type (LC or SKBDN)
 * @param documentType - Optional document type filter (e.g., 'COMMERCIAL_INVOICE')
 * @param topK - Number of results to return (default: 5)
 * @returns Array of matching regulatory chunks ordered by relevance
 *
 * Satisfies: Requirements 8.2, 12.3
 */
export async function retrieveRegulatory(
  query: string,
  transactionType: 'LC' | 'SKBDN',
  documentType?: string,
  topK = 5,
): Promise<RegulatoryChunk[]> {
  const embedding = await embedText(query)

  const filter = {
    must: [
      { key: 'applicableTo', match: { any: [transactionType, 'ALL'] } },
      ...(documentType
        ? [{ key: 'documentTypes', match: { any: [documentType, 'ALL'] } }]
        : []),
    ],
  }

  const results = await qdrant.search(collectionName, {
    vector: embedding,
    filter,
    limit: topK,
    with_payload: true,
  })

  return results.map((r) => r.payload as unknown as RegulatoryChunk)
}
