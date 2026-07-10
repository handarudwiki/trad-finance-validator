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
export function ValidationProgress({ transactionId }: ValidationProgressProps) {
  const router = useRouter()
  const [status, setStatus] = useState<TransactionResponse['status']>('VALIDATING')
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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
          router.push(`/transactions/${transactionId}/report`)
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
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-700">Validasi Gagal</h2>
        <p className="max-w-md text-center text-sm text-gray-600">
          {errorDetails}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      <h2 className="text-xl font-semibold text-gray-800">Sedang Divalidasi</h2>
      <p className="text-sm text-gray-500">
        Sistem sedang memvalidasi dokumen Anda. Mohon tunggu...
      </p>
    </div>
  )
}
