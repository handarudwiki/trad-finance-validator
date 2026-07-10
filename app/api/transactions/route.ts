/**
 * GET /api/transactions
 * Lists all transactions ordered by most recent first.
 *
 * POST /api/transactions
 * Creates a new validation transaction with status DRAFT.
 * Satisfies: Requirements 1.1, 1.2
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateTransactionSchema } from '@/schema/transaction'

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(transactions, { status: 200 })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data transaksi. Pastikan database terhubung.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = CreateTransactionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.create({
      data: { type: result.data.type },
    })

    return NextResponse.json(
      {
        id: transaction.id,
        type: transaction.type,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json(
      { error: 'Gagal membuat transaksi. Pastikan database terhubung.' },
      { status: 500 }
    )
  }
}
