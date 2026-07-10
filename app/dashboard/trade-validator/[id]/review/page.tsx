import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ExtractionReviewForm } from '@/components/ExtractionReviewForm'
import { TopBar } from '@/components/layout/TopBar'

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

const STEPS = ['Create', 'Upload', 'Review', 'Validate', 'Report']

function StepBar({ current }: { current: number }) {
  return (
    <div className="steps">
      {STEPS.map((label, i) => {
        const isDone = i < current
        const isActive = i === current
        return (
          <div key={label} className="step">
            <div className={`step-dot${isActive ? ' active' : isDone ? ' done' : ''}`}>
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`step-text${isActive ? ' active' : isDone ? ' done' : ''}`}>{label}</span>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: isDone ? '#16A34A' : 'var(--border)', margin: '0 8px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { sourceDocument: true },
  })

  if (!transaction) redirect('/dashboard/trade-validator/new')

  if (transaction.status !== 'EXTRACTION_REVIEW') {
    switch (transaction.status) {
      case 'DRAFT': redirect(`/dashboard/trade-validator/${id}/upload`)
      case 'VALIDATING': redirect(`/dashboard/trade-validator/${id}/validate`)
      case 'COMPLETED': redirect(`/dashboard/trade-validator/${id}/report`)
      case 'FAILED': redirect(`/dashboard/trade-validator/${id}/report`)
      default: redirect(`/dashboard/trade-validator/${id}/upload`)
    }
  }

  const sourceDoc = transaction.sourceDocument
  if (!sourceDoc || !sourceDoc.extractedFields) {
    redirect(`/dashboard/trade-validator/${id}/upload`)
  }

  const extractedFields = sourceDoc.extractedFields as Record<string, unknown>
  const confidence = (sourceDoc.confidence as Record<string, number>) ?? {}

  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: 'Trade Validator', href: '/dashboard/trade-validator' },
          { label: `${transaction.type} · ${id.slice(0, 8)}…`, href: `/dashboard/trade-validator/${id}/upload` },
          { label: 'Review Extraction' },
        ]}
      />

      <div className="dashboard-content">
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">Review Extraction</h1>
            <p className="page-subtitle">
              Verify and correct data extracted from the source document. Low-confidence fields are highlighted.
            </p>
          </div>
        </div>

        <StepBar current={2} />

        <ExtractionReviewForm
          initialValues={extractedFields as never}
          confidence={confidence}
          transactionId={id}
        />
      </div>
    </>
  )
}
