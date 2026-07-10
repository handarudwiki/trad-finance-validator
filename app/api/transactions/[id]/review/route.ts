/**
 * PATCH /api/transactions/[id]/review
 * Validates reviewed fields against ExtractedLCFieldsSchema,
 * stores reviewedFields and reviewedAt on SourceDocument,
 * and advances transaction status.
 * Satisfies: Requirements 4.4, 4.5, 4.6, 4.7
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExtractedLCFieldsSchema } from '@/schema/extraction'

export async function PATCH(
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
      { error: 'No source document found for this transaction' },
      { status: 409 }
    )
  }

  // Parse and validate body against ExtractedLCFieldsSchema
  const body = await request.json()
  const result = ExtractedLCFieldsSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Schema validation failed', details: result.error.issues },
      { status: 400 }
    )
  }

  const reviewedAt = new Date()

  // Update SourceDocument with reviewedFields and reviewedAt
  await prisma.sourceDocument.update({
    where: { id: transaction.sourceDocument.id },
    data: {
      reviewedFields: result.data as unknown as import('@prisma/client').Prisma.InputJsonValue,
      reviewedAt,
    },
  })

  // Advance transaction status past EXTRACTION_REVIEW
  const updatedTransaction = await prisma.transaction.update({
    where: { id },
    data: { status: 'EXTRACTION_REVIEW' },
  })

  // Derive required documents from reviewedFields
  const requiredDocuments = result.data.requiredDocuments

  return NextResponse.json(
    {
      status: updatedTransaction.status,
      reviewedAt: reviewedAt.toISOString(),
      requiredDocuments,
    },
    { status: 200 }
  )
}
