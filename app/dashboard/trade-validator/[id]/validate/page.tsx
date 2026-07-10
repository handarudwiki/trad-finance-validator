'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ValidationProgress } from '@/components/ValidationProgress'
import { TopBar } from '@/components/layout/TopBar'

const STEPS = ['Create', 'Upload', 'Review', 'Documents', 'Validate', 'Report']

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

export default function ValidatePage() {
  const params = useParams<{ id: string }>()
  const transactionId = params.id

  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: 'Trade Validator', href: '/dashboard/trade-validator' },
          { label: 'Validating' },
        ]}
        actions={
          <Link href="/dashboard/trade-validator" className="btn btn-ghost btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to List
          </Link>
        }
      />

      <div className="dashboard-content">
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">Validation in Progress</h1>
            <p className="page-subtitle">
              The system is validating your documents. This may take a few moments.
            </p>
          </div>
        </div>

        <StepBar current={4} />

        <div style={{ maxWidth: '480px' }}>
          <div className="card">
            <div className="card-body" style={{ padding: '40px 32px' }}>
              <ValidationProgress transactionId={transactionId} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
