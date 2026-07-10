'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TransactionResponse {
  id: string
  status: 'DRAFT' | 'EXTRACTION_REVIEW' | 'VALIDATING' | 'COMPLETED' | 'FAILED'
  errorDetails?: string | null
}

interface ValidationProgressProps {
  transactionId: string
}

/**
 * Polls GET /api/transactions/:id every 3 seconds to track validation progress.
 * Shows spinner while VALIDATING, redirects on COMPLETED, shows error on FAILED.
 * Satisfies: Requirements 14.1–14.6
 */
const LOADING_STEPS = [
  'Initializing validator...',
  'Analyzing document structure...',
  'Running compliance rules...',
  'Verifying LC/SKBDN terms...',
  'Checking signature validity...',
  'Generating final audit report...',
]

export function ValidationProgress({ transactionId }: ValidationProgressProps) {
  const router = useRouter()
  const [status, setStatus] = useState<TransactionResponse['status']>('VALIDATING')
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [loadingStepIndex, setLoadingStepIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (status !== 'VALIDATING') return
    const stepInterval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length)
    }, 2500)
    return () => clearInterval(stepInterval)
  }, [status])

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`, {
          credentials: 'include',
        })
        if (!res.ok) return

        const data: TransactionResponse = await res.json()
        setStatus(data.status)

        if (data.status === 'COMPLETED') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          router.push(`/dashboard/trade-validator/${transactionId}/report`)
        } else if (data.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setErrorDetails(data.errorDetails ?? 'Terjadi kesalahan yang tidak diketahui.')
        }
      } catch {
        // Silently retry on network error
      }
    }

    // Initial poll
    poll()

    // Poll every 3 seconds
    intervalRef.current = setInterval(poll, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [transactionId, router])

  if (status === 'FAILED') {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-200">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-base font-bold text-red-700">Validasi Gagal</h2>
        <p className="max-w-md text-xs text-red-650 font-semibold mt-1">
          {errorDetails}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="spinner" style={{ width: '40px', height: '40px' }} />
      <h2 className="text-base font-bold text-zinc-900">Validating Documents</h2>
      <div className="h-6 flex items-center justify-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 animate-pulse">
          {LOADING_STEPS[loadingStepIndex]}
        </p>
      </div>
      <p className="text-xs text-zinc-500 max-w-sm mt-1">
        Sistem sedang memvalidasi dokumen Anda. Mohon tunggu...
      </p>
    </div>
  )
}
