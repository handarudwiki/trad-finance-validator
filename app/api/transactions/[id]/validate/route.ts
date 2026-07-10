/**
 * POST /api/transactions/[id]/validate
 * Triggers the full validation pipeline asynchronously.
 * Verifies transaction exists and is in correct status,
 * then fires the validation orchestrator without awaiting.
 * Returns 202 immediately.
 * Satisfies: Requirements 14.3
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runValidation } from '@/lib/validation/orchestrator'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify transaction exists
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { sourceDocument: true, supportingDocs: true },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  // Verify transaction is in a valid status for validation
  if (transaction.status === 'VALIDATING') {
    return NextResponse.json(
      { error: 'Validation is already in progress' },
      { status: 409 }
    )
  }

  if (transaction.status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'Transaction has already been validated' },
      { status: 409 }
    )
  }

  if (!transaction.sourceDocument?.reviewedFields) {
    return NextResponse.json(
      { error: 'Source document fields must be reviewed before validation' },
      { status: 409 }
    )
  }

  // Fire and forget: trigger validation asynchronously
  runValidation(id).catch(() => {
    // Error handling is done inside runValidation (sets status to FAILED)
  })

  return NextResponse.json(
    { message: 'Validation started', transactionId: id },
    { status: 202 }
  )
}
