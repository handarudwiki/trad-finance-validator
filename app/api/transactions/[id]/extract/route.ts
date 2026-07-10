/**
 * POST /api/transactions/[id]/extract
 * Triggers source document extraction asynchronously.
 * Returns 202 immediately; extraction runs in the background.
 * On success: updates extractedFields, confidence, extractedAt and sets status to EXTRACTION_REVIEW.
 * On failure: sets transaction status to FAILED with errorDetails.
 * Satisfies: Requirements 3.1–3.6, 14.2
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from '@/lib/storage'
import { extractSourceDocument } from '@/lib/extraction/extractSourceDocument'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify transaction exists
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { sourceDocument: true },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  if (!transaction.sourceDocument) {
    return NextResponse.json(
      { error: 'No source document uploaded for this transaction' },
      { status: 409 }
    )
  }

  // Fire and forget: trigger extraction asynchronously
  extractSourceDocumentAsync(
    transaction.sourceDocument.id,
    transaction.sourceDocument.filePath,
    transaction.sourceDocument.mimeType,
    transaction.type as 'LC' | 'SKBDN',
    id
  ).catch(() => {
    // Error handling is done inside the async function
  })

  return NextResponse.json(
    { message: 'Extraction started', transactionId: id },
    { status: 202 }
  )
}

async function extractSourceDocumentAsync(
  sourceDocId: string,
  filePath: string,
  mimeType: string,
  transactionType: 'LC' | 'SKBDN',
  transactionId: string
): Promise<void> {
  try {
    const fileBuffer = await readFile(filePath)
    const extracted = await extractSourceDocument(fileBuffer, mimeType, transactionType)

    // Update source document with extracted fields and confidence
    await prisma.sourceDocument.update({
      where: { id: sourceDocId },
      data: {
        extractedFields: extracted as unknown as import('@prisma/client').Prisma.InputJsonValue,
        confidence: (extracted.confidence ?? {}) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        extractedAt: new Date(),
      },
    })

    // Advance transaction status to EXTRACTION_REVIEW
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'EXTRACTION_REVIEW' },
    })
  } catch (error) {
    // Set transaction status to FAILED with sanitized error (no traces exposed to frontend)
    console.error('[extractSourceDocumentAsync] Extraction failed:', error)
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        errorDetails: 'Ekstraksi dokumen gagal. Silakan coba lagi nanti.',
      },
    })
  }
}
