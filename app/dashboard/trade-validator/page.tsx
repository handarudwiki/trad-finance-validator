import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TransactionStatus } from '@prisma/client'
import { TopBar } from '@/components/layout/TopBar'

const STATUS_LABELS: Record<TransactionStatus, string> = {
  DRAFT: 'Draft',
  EXTRACTION_REVIEW: 'Extraction Review',
  VALIDATING: 'Validating',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}

const STATUS_BADGE: Record<TransactionStatus, string> = {
  DRAFT: 'badge badge-draft',
  EXTRACTION_REVIEW: 'badge badge-review',
  VALIDATING: 'badge badge-validating',
  COMPLETED: 'badge badge-completed',
  FAILED: 'badge badge-failed',
}

function getTransactionLink(id: string, status: TransactionStatus): string {
  switch (status) {
    case 'DRAFT':
      return `/dashboard/trade-validator/${id}/upload`
    case 'EXTRACTION_REVIEW':
      return `/dashboard/trade-validator/${id}/review`
    case 'VALIDATING':
      return `/dashboard/trade-validator/${id}/validate`
    case 'COMPLETED':
    case 'FAILED':
      return `/dashboard/trade-validator/${id}/report`
    default:
      return `/dashboard/trade-validator/${id}/upload`
  }
}

function getActionLabel(status: TransactionStatus): string {
  switch (status) {
    case 'DRAFT': return 'Upload Docs'
    case 'EXTRACTION_REVIEW': return 'Review'
    case 'VALIDATING': return 'View Progress'
    case 'COMPLETED': return 'View Report'
    case 'FAILED': return 'View Error'
    default: return 'Open'
  }
}

export default async function TradeValidatorPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const total = transactions.length
  const pending = transactions.filter(
    (t) => t.status === 'DRAFT' || t.status === 'EXTRACTION_REVIEW' || t.status === 'VALIDATING'
  ).length
  const completed = transactions.filter((t) => t.status === 'COMPLETED').length
  const failed = transactions.filter((t) => t.status === 'FAILED').length

  return (
    <>
      <TopBar
        breadcrumbs={[{ label: 'Trade Validator' }]}
        actions={
          <Link href="/dashboard/trade-validator/new" className="btn btn-primary btn-sm">
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
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value accent">{pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value success">{completed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Failed</div>
            <div className="stat-value danger">{failed}</div>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <div className="card-header">
            <span className="card-title">Validation History</span>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {total} record{total !== 1 ? 's' : ''}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  <path d="M12 8v4" />
                </svg>
              </div>
              <p className="empty-state-title">No validations yet</p>
              <p className="empty-state-desc">
                Start your first trade document validation by clicking below.
              </p>
              <Link href="/dashboard/trade-validator/new" className="btn btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Validation
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <Link
                        href={getTransactionLink(tx.id, tx.status)}
                        className="table-id-link"
                        title={tx.id}
                      >
                        {tx.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td>
                      <span className="badge-type">{tx.type}</span>
                    </td>
                    <td>
                      <span className={STATUS_BADGE[tx.status]}>
                        {STATUS_LABELS[tx.status]}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tx.updatedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <Link
                        href={getTransactionLink(tx.id, tx.status)}
                        className="btn btn-secondary btn-sm"
                      >
                        {getActionLabel(tx.status)}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
