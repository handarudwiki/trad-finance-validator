'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DocumentChecklist } from '@/components/DocumentChecklist'
import { TopBar } from '@/components/layout/TopBar'

interface RequiredDocument {
  documentType: string
  originals: number
  copies: number
  requirements?: string | null
}

const STEPS = ['Upload', 'Review', 'Documents', 'Validate', 'Report']

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

export default function DocumentsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const transactionId = params.id

  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<{ documentType: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTransaction() {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`, { credentials: 'include' })
        if (!res.ok) { setError('Failed to load transaction data.'); setLoading(false); return }
        const data = await res.json()
        const reviewedFields = data.sourceDocument?.reviewedFields
        if (reviewedFields?.requiredDocuments) {
          setRequiredDocuments(reviewedFields.requiredDocuments)
        }
        if (data.supportingDocs) {
          setUploadedDocs(data.supportingDocs)
        }
      } catch {
        setError('Unable to connect to server.')
      } finally {
        setLoading(false)
      }
    }
    loadTransaction()
  }, [transactionId])

  const handleValidate = async () => {
    setValidating(true)
    setError(null)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/validate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to start validation.')
        setValidating(false)
        return
      }
      router.push(`/dashboard/trade-validator/${transactionId}/validate`)
    } catch {
      setError('Unable to connect to server. Please check your connection.')
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopBar breadcrumbs={[{ label: 'Trade Validator', href: '/dashboard/trade-validator' }, { label: 'Supporting Documents' }]} />
        <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <span className="spinner spinner-dark" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: 'Trade Validator', href: '/dashboard/trade-validator' },
          { label: 'Supporting Documents' },
        ]}
        actions={
          <a href="/dashboard/trade-validator" className="btn btn-secondary h-10 px-4 flex items-center gap-2" style={{ borderRadius: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </a>
        }
      />

      <div className="dashboard-content">
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">Upload Supporting Documents</h1>
            <p className="page-subtitle">
              Upload all required supporting documents as specified in the LC/SKBDN terms.
            </p>
          </div>
        </div>

        <StepBar current={2} />

        <div>
          <DocumentChecklist
            requiredDocuments={requiredDocuments}
            uploadedDocs={uploadedDocs}
            transactionId={transactionId}
          />

          {error && (
            <div className="alert alert-error" style={{ margin: '20px 0 16px 0', borderRadius: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={handleValidate}
              disabled={validating}
              className="btn btn-primary h-10 px-8 text-sm font-semibold flex items-center justify-center gap-2"
              style={{ borderRadius: '8px', minWidth: '220px' }}
            >
              {validating ? (
                <>
                  <span className="spinner w-4 h-4" />
                  <span>Starting validation…</span>
                </>
              ) : (
                <>
                  <span>Validate Documents</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
