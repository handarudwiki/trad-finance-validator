import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      sourceDocument: true,
      supportingDocs: true,
      discrepancyReport: { include: { findings: true } },
    },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  return NextResponse.json(transaction, { status: 200 })
}
