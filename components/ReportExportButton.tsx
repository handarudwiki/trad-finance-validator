'use client'

import { useState } from 'react'

interface ReportExportButtonProps {
  transactionId: string
}

/**
 * Downloads the PDF report via GET /api/transactions/:id/report/export.
 * Satisfies: Requirements 11.1, 11.3
 */
export function ReportExportButton({ transactionId }: ReportExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/transactions/${transactionId}/report/export`,
        { credentials: 'include' }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.error ?? `Gagal mengunduh laporan (${res.status})`
        )
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${transactionId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengunduh laporan.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="btn btn-primary h-10 px-4 flex items-center gap-2"
        style={{ borderRadius: '8px' }}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Mengunduh...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Ekspor PDF
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
