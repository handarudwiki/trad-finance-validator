'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DocumentUploader } from '@/components/DocumentUploader'
import { TopBar } from '@/components/layout/TopBar'
import { FormSection } from '@/components/FormSection'

const STEPS = [
  { label: 'Upload' },
  { label: 'Review' },
  { label: 'Documents' },
  { label: 'Validate' },
  { label: 'Report' },
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="steps">
      {STEPS.map((step, i) => {
        const isDone = i < current
        const isActive = i === current
        return (
          <div key={step.label} className="step">
            <div className={`step-dot${isActive ? ' active' : isDone ? ' done' : ''}`}>
              {isDone ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`step-text${isActive ? ' active' : isDone ? ' done' : ''}`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: isDone ? '#16A34A' : 'var(--border)', margin: '0 8px', transition: 'background 200ms' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function UploadPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [uploaded, setUploaded] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasReviewedFields, setHasReviewedFields] = useState(false)
  const [amendmentUploading, setAmendmentUploading] = useState(false)
  const [amendmentSuccess, setAmendmentSuccess] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const transactionId = params.id

  useEffect(() => {
    async function checkTransaction() {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (data.sourceDocument?.reviewedFields) setHasReviewedFields(true)
      } catch { /* silent */ }
    }
    checkTransaction()
  }, [transactionId])

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/transactions/${transactionId}/source-document`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to upload source document.')
    }
    setUploaded(true)
  }

  const handleAmendmentUpload = async (file: File) => {
    setAmendmentUploading(true)
    setError(null)
    setAmendmentSuccess(false)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/amendment`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to upload amendment.')
      }
      setAmendmentSuccess(true)
      setTimeout(() => { window.location.reload() }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload amendment.')
    } finally {
      setAmendmentUploading(false)
    }
  }

  const pollStatus = useCallback(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'EXTRACTION_REVIEW') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          router.push(`/dashboard/trade-validator/${transactionId}/review`)
        } else if (data.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setExtracting(false)
          setError(data.errorDetails || 'Extraction failed. Please try again.')
        }
      } catch { /* silent retry */ }
    }, 3000)
  }, [transactionId, router])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const handleExtract = async () => {
    setExtracting(true)
    setError(null)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/extract`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setExtracting(false)
        setError(data.error || 'Failed to start extraction.')
        return
      }
      pollStatus()
    } catch {
      setExtracting(false)
      setError('Unable to connect to server. Please check your connection.')
    }
  }

  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: 'Trade Validator', href: '/dashboard/trade-validator' },
          { label: 'Upload Document' },
        ]}
        actions={
          <Link href="/dashboard/trade-validator" className="btn btn-secondary h-10 px-4 flex items-center gap-2" style={{ borderRadius: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Cancel
          </Link>
        }
      />

      <div className="dashboard-content">
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">Upload Source Document</h1>
            <p className="page-subtitle">
              Upload the LC or SKBDN document to extract structured data automatically.
            </p>
          </div>
        </div>

        <StepBar current={0} />

        <div>
          {/* Amendment section */}
          {hasReviewedFields && (
            <FormSection
              title="Upload Amendment"
              badge={
                <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>
                  Amendment
                </span>
              }
              style={{ borderColor: '#fde68a' }}
              bodyStyle={{ background: '#fffbeb' }}
              headerStyle={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}
            >
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Source document has been previously reviewed. Upload an amendment to update the extracted data.
              </p>
              <DocumentUploader onUpload={handleAmendmentUpload} label="Amendment File (LC/SKBDN)" disabled={amendmentUploading} />
              {amendmentUploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <span className="spinner spinner-dark" style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Uploading amendment…</span>
                </div>
              )}
              {amendmentSuccess && (
                <div className="alert alert-success" style={{ marginTop: '12px', borderRadius: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Amendment uploaded. Reloading…
                </div>
              )}
            </FormSection>
          )}

          {/* Standard upload */}
          {!hasReviewedFields && (
            <FormSection title="Source Document">
              <DocumentUploader onUpload={handleUpload} label="LC / SKBDN Document" disabled={extracting} />
              
              {/* Download example document */}
              <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500 font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                <span>Need a test file?</span>
                <a href="/examples/sample_lc.pdf" download className="text-zinc-850 hover:underline font-bold">Download Sample LC Document</a>
              </div>
            </FormSection>
          )}

          {/* Extract button */}
          {uploaded && !extracting && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={handleExtract}
                className="btn btn-primary h-10 px-8 text-sm font-semibold flex items-center justify-center gap-2"
                style={{ borderRadius: '8px', minWidth: '220px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
                </svg>
                Extract Data from Document
              </button>
            </div>
          )}

          {/* Extracting state */}
          {extracting && (
            <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
              <div className="card-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <span className="spinner spinner-dark" style={{ width: '32px', height: '32px', borderWidth: '3px', display: 'inline-block', marginBottom: '16px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Extracting data…</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  AI is reading your document. This may take a moment.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginTop: '16px', borderRadius: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
