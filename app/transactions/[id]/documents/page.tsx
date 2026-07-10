'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DocumentChecklist } from '@/components/DocumentChecklist'

interface RequiredDocument {
  documentType: string
  originals: number
  copies: number
  requirements?: string | null
}

export default function DocumentsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const transactionId = params.id

  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTransaction() {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`, {
          credentials: 'include',
        })
        if (!res.ok) {
          setError('Gagal memuat data transaksi.')
          setLoading(false)
          return
        }

        const data = await res.json()
        const reviewedFields = data.sourceDocument?.reviewedFields

        if (reviewedFields?.requiredDocuments) {
          setRequiredDocuments(reviewedFields.requiredDocuments)
        }
      } catch {
        setError('Gagal terhubung ke server.')
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
      const res = await fetch(`/api/transactions/${transactionId}/validate`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Gagal memulai validasi.')
        setValidating(false)
        return
      }

      router.push(`/transactions/${transactionId}/validate`)
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.')
      setValidating(false)
    }
}

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unggah Dokumen Pendukung</h1>
          <p className="mt-1 text-gray-600">
            Unggah semua dokumen pendukung yang diperlukan sesuai ketentuan LC/SKBDN.
          </p>
        </div>

        <DocumentChecklist
          requiredDocuments={requiredDocuments}
          transactionId={transactionId}
        />

        <div className="border-t pt-4">
          <button
            onClick={handleValidate}
            disabled={validating}
            className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {validating ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-white"
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
                Memulai validasi...
              </span>
            ) : (
              'Validasi Dokumen'
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}