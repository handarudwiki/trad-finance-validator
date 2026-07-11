import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { TradeValidatorTableClient } from '@/components/TradeValidatorTableClient'

export default async function TradeValidatorPage() {
  const initialLimit = 10
  const totalItems = await prisma.transaction.count()

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: initialLimit,
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Serialize Date objects to ISO strings for safe client-side prop passing
  const serializedTransactions = transactions.map((tx) => ({
    ...tx,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  }))

  return (
    <>
      <TopBar
        breadcrumbs={[{ label: 'Trade Validator' }]}
        actions={
          <Link href="/dashboard/trade-validator/new" className="btn btn-primary h-10 px-4 flex items-center gap-2" style={{ borderRadius: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Validation
          </Link>
        }
      />

      <div className="dashboard-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Trade Validator</h1>
            <p className="page-subtitle">
              Validate LC and SKBDN trade finance documents against UCP 600, ISBP 745, and PBI regulations.
            </p>
          </div>
          <Link href="/dashboard/trade-validator/new" className="btn btn-primary h-10 px-4 flex items-center gap-2" style={{ borderRadius: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Validation
          </Link>
        </div>

        {/* Client-side Search, Filtering, and History Table */}
        <TradeValidatorTableClient
          initialTransactions={serializedTransactions}
          initialTotalItems={totalItems}
          initialLimit={initialLimit}
        />
      </div>
    </>
  )
}
