/**
 * Regulatory Knowledge Base Ingestion Script
 *
 * Loads regulatory JSON data files (UCP 600, ISBP 745, PBI SKBDN) and ingests them
 * into the Qdrant vector store for RAG retrieval.
 *
 * Usage:
 *   npx tsx scripts/ingest-regulatory-docs.ts
 *
 * Prerequisites:
 *   - Qdrant instance running at QDRANT_URL
 *   - GEMINI_API_KEY set for embedding generation
 *   - .env.local configured with required environment variables
 *
 * Satisfies: Requirements 12.1, 12.2, 12.4, 12.5
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { resolve } from 'path'
import { config } from 'dotenv'

// Load environment variables from .env.local BEFORE importing modules that depend on env
config({ path: resolve(process.cwd(), '.env.local') })

interface SourceSummary {
  source: string
  count: number
}

async function main(): Promise<void> {
  // Dynamic imports to ensure env vars are loaded first
  const { ensureCollection, upsertChunk, loadRegDataFile } = await import('../lib/rag/ingest')
  const { embedText } = await import('../lib/rag/embed')

  console.log('=== Regulatory Knowledge Base Ingestion ===\n')

  // Ensure Qdrant collection exists (creates if needed)
  console.log('Ensuring Qdrant collection exists...')
  await ensureCollection()
  console.log('Collection ready.\n')

  const files = [
    { path: resolve(process.cwd(), 'data/regulatory/ucp600.json'), source: 'UCP_600' },
    { path: resolve(process.cwd(), 'data/regulatory/isbp745.json'), source: 'ISBP_745' },
    { path: resolve(process.cwd(), 'data/regulatory/pbi_skbdn.json'), source: 'PBI_SKBDN' },
  ]

  const summaries: SourceSummary[] = []

  for (const file of files) {
    const chunks = await loadRegDataFile(file.path)
    console.log(`Processing ${file.source}: ${chunks.length} chunks`)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const vector = await embedText(chunk.text)
      await upsertChunk(chunk, vector)
      console.log(`  [${i + 1}/${chunks.length}] ${chunk.article} — ${chunk.title}`)
    }

    summaries.push({ source: file.source, count: chunks.length })
    console.log(`  ✓ ${file.source} complete\n`)
  }

  // Print summary
  console.log('=== Ingestion Summary ===')
  let total = 0
  for (const s of summaries) {
    console.log(`  ${s.source}: ${s.count} chunks`)
    total += s.count
  }
  console.log(`  ─────────────────────────`)
  console.log(`  Total: ${total} chunks ingested`)
  console.log('\nIngestion complete!')
}

main().catch((err) => {
  console.error('Ingestion failed:', err)
  process.exit(1)
})
