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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'ALL'
    const status = searchParams.get('status') || 'ALL'
    const date = searchParams.get('date') || ''
    const updatedDate = searchParams.get('updatedDate') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        {
          id: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          sourceDocument: {
            fileName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (type !== 'ALL') {
      where.type = type
    }

    if (status !== 'ALL') {
      where.status = status
    }

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.createdAt = {
        gte: start,
        lte: end,
      }
    }

    if (updatedDate) {
      const start = new Date(updatedDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(updatedDate)
      end.setHours(23, 59, 59, 999)
      where.updatedAt = {
        gte: start,
        lte: end,
      }
    }

    // Get total count for pagination calculations
    const totalItems = await prisma.transaction.count({ where })

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        sourceDocument: {
          select: {
            fileName: true,
          },
        },
      },
    })

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      }
    }, { status: 200 })
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
