/**
 * Unit tests for RAG service: embed, retrieve, and ingest modules.
 * Validates: Requirements 8.1, 8.2, 8.3, 12.1, 12.2, 12.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSearch, mockCollectionExists, mockCreateCollection, mockUpsert } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
  mockCollectionExists: vi.fn(),
  mockCreateCollection: vi.fn(),
  mockUpsert: vi.fn(),
}))

// Mock @/lib/config
vi.mock('@/lib/config', () => ({
  env: {
    GEMINI_API_KEY: 'test-key',
    QDRANT_URL: 'http://localhost:6333',
    QDRANT_COLLECTION: 'regulatory_knowledge',
    DATABASE_URL: 'postgresql://test',
    STORAGE_PATH: './uploads',
    SESSION_SECRET: 'test-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

// Mock @/lib/gemini
vi.mock('@/lib/gemini', () => ({
  embeddingModel: {
    embedContent: vi.fn(),
  },
  visionModel: {},
  genAI: {},
  getVisionModel: vi.fn(),
}))

// Mock @qdrant/js-client-rest with a proper constructor
vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: class MockQdrantClient {
    search = mockSearch
    collectionExists = mockCollectionExists
    createCollection = mockCreateCollection
    upsert = mockUpsert
  },
}))

// Mock fs/promises for ingest tests
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}))

import { embedText } from '@/lib/rag/embed'
import { retrieveRegulatory, type RegulatoryChunk } from '@/lib/rag/retrieve'
import { ensureCollection, upsertChunk, loadRegDataFile } from '@/lib/rag/ingest'
import { embeddingModel } from '@/lib/gemini'
import { readFile } from 'fs/promises'

describe('lib/rag/embed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call embeddingModel.embedContent and return the embedding values', async () => {
    const mockValues = [0.1, 0.2, 0.3, 0.4, 0.5]
    vi.mocked(embeddingModel.embedContent).mockResolvedValue({
      embedding: { values: mockValues },
    } as any)

    const result = await embedText('test query')

    expect(embeddingModel.embedContent).toHaveBeenCalledWith('test query')
    expect(result).toEqual(mockValues)
  })

  it('should propagate errors from the embedding model', async () => {
    vi.mocked(embeddingModel.embedContent).mockRejectedValue(new Error('API error'))

    await expect(embedText('test')).rejects.toThrow('API error')
  })
})

describe('lib/rag/retrieve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should embed query and search Qdrant with LC transaction type filter', async () => {
    const mockEmbedding = Array(768).fill(0.1)
    vi.mocked(embeddingModel.embedContent).mockResolvedValue({
      embedding: { values: mockEmbedding },
    } as any)

    const mockChunk: RegulatoryChunk = {
      source: 'UCP_600',
      article: 'ucp600-art14a',
      title: 'Standard for Examination of Documents',
      text: 'A nominated bank acting on its nomination...',
      relatedClauses: ['art14b', 'art14c'],
      applicableTo: ['LC', 'ALL'],
      documentTypes: ['COMMERCIAL_INVOICE', 'ALL'],
    }

    mockSearch.mockResolvedValue([
      { id: 'ucp600-art14a', version: 1, score: 0.95, payload: mockChunk },
    ])

    const result = await retrieveRegulatory('document examination', 'LC')

    expect(embeddingModel.embedContent).toHaveBeenCalledWith('document examination')
    expect(mockSearch).toHaveBeenCalledWith('regulatory_knowledge', {
      vector: mockEmbedding,
      filter: {
        must: [
          { key: 'applicableTo', match: { any: ['LC', 'ALL'] } },
        ],
      },
      limit: 5,
      with_payload: true,
    })
    expect(result).toEqual([mockChunk])
  })

  it('should include documentType filter when documentType is provided', async () => {
    const mockEmbedding = Array(768).fill(0.2)
    vi.mocked(embeddingModel.embedContent).mockResolvedValue({
      embedding: { values: mockEmbedding },
    } as any)

    mockSearch.mockResolvedValue([])

    await retrieveRegulatory('invoice check', 'SKBDN', 'COMMERCIAL_INVOICE', 3)

    expect(mockSearch).toHaveBeenCalledWith('regulatory_knowledge', {
      vector: mockEmbedding,
      filter: {
        must: [
          { key: 'applicableTo', match: { any: ['SKBDN', 'ALL'] } },
          { key: 'documentTypes', match: { any: ['COMMERCIAL_INVOICE', 'ALL'] } },
        ],
      },
      limit: 3,
      with_payload: true,
    })
  })

  it('should use default topK of 5 when not specified', async () => {
    const mockEmbedding = Array(768).fill(0.1)
    vi.mocked(embeddingModel.embedContent).mockResolvedValue({
      embedding: { values: mockEmbedding },
    } as any)
    mockSearch.mockResolvedValue([])

    await retrieveRegulatory('query', 'LC')

    expect(mockSearch).toHaveBeenCalledWith(
      'regulatory_knowledge',
      expect.objectContaining({ limit: 5 }),
    )
  })

  it('should return empty array when no results found', async () => {
    vi.mocked(embeddingModel.embedContent).mockResolvedValue({
      embedding: { values: Array(768).fill(0) },
    } as any)
    mockSearch.mockResolvedValue([])

    const result = await retrieveRegulatory('no match', 'LC')
    expect(result).toEqual([])
  })
})

describe('lib/rag/ingest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ensureCollection', () => {
    it('should create collection when it does not exist', async () => {
      mockCollectionExists.mockResolvedValue({ exists: false })
      mockCreateCollection.mockResolvedValue(true)

      await ensureCollection()

      expect(mockCollectionExists).toHaveBeenCalledWith('regulatory_knowledge')
      expect(mockCreateCollection).toHaveBeenCalledWith('regulatory_knowledge', {
        vectors: {
          size: 768,
          distance: 'Cosine',
        },
      })
    })

    it('should not create collection when it already exists', async () => {
      mockCollectionExists.mockResolvedValue({ exists: true })

      await ensureCollection()

      expect(mockCollectionExists).toHaveBeenCalledWith('regulatory_knowledge')
      expect(mockCreateCollection).not.toHaveBeenCalled()
    })
  })

  describe('upsertChunk', () => {
    it('should upsert chunk with vector into Qdrant', async () => {
      const chunk: RegulatoryChunk = {
        source: 'UCP_600',
        article: 'ucp600-art14a',
        title: 'Standard for Examination',
        text: 'A nominated bank...',
        relatedClauses: ['art14b'],
        applicableTo: ['LC', 'ALL'],
        documentTypes: ['COMMERCIAL_INVOICE'],
      }
      const vector = Array(768).fill(0.5)
      mockUpsert.mockResolvedValue({ status: 'completed' })

      await upsertChunk(chunk, vector)

      expect(mockUpsert).toHaveBeenCalledWith('regulatory_knowledge', {
        wait: true,
        points: [
          {
            id: 'ucp600-art14a',
            vector,
            payload: {
              source: 'UCP_600',
              article: 'ucp600-art14a',
              title: 'Standard for Examination',
              text: 'A nominated bank...',
              relatedClauses: ['art14b'],
              applicableTo: ['LC', 'ALL'],
              documentTypes: ['COMMERCIAL_INVOICE'],
            },
          },
        ],
      })
    })
  })

  describe('loadRegDataFile', () => {
    it('should read and parse a JSON file into RegulatoryChunk array', async () => {
      const mockData: RegulatoryChunk[] = [
        {
          source: 'UCP_600',
          article: 'ucp600-art14a',
          title: 'Standard for Examination',
          text: 'A nominated bank...',
          relatedClauses: ['art14b'],
          applicableTo: ['LC', 'ALL'],
          documentTypes: ['COMMERCIAL_INVOICE'],
        },
      ]

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData))

      const result = await loadRegDataFile('/path/to/ucp600.json')

      expect(readFile).toHaveBeenCalledWith('/path/to/ucp600.json', 'utf-8')
      expect(result).toEqual(mockData)
    })

    it('should throw on invalid JSON', async () => {
      vi.mocked(readFile).mockResolvedValue('not valid json{')

      await expect(loadRegDataFile('/path/to/bad.json')).rejects.toThrow()
    })
  })
})
