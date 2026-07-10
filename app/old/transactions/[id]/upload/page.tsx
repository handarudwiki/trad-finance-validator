'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DocumentUploader } from '@/components/DocumentUploader'

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
        const res = await fetch(`/api/transactions/${transactionId}`, {
          credentials: 'include',
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.sourceDocument?.reviewedFields) {
          setHasReviewedFields(true)
        }
      } catch {
        // Silently fail
      }
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
      throw new Error(data.error || 'Gagal mengunggah dokumen sumber.')
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
        throw new Error(data.error || 'Gagal mengunggah amendemen.')
      }

      setAmendmentSuccess(true)
      setTimeout(() => { window.location.reload() }, 1500)
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah amendemen.')
    } finally {
      setAmendmentUploading(false)
    }
  }

  const pollStatus = useCallback(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`, {
          credentials: 'include',
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'EXTRACTION_REVIEW') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          router.push(`/old/transactions/${transactionId}/review`)
        } else if (data.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setExtracting(false)
          setError(data.errorDetails || 'Ekstraksi gagal. Silakan coba lagi.')
        }
      } catch {
        // Silently retry
      }
    }, 3000)
  }, [transactionId, router])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleExtract = async () => {
    setExtracting(true)
    setError(null)

    try {
      const res = await fetch(`/api/transactions/${transactionId}/extract`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setExtracting(false)
        setError(data.error || 'Gagal memulai ekstraksi.')
        return
      }

      pollStatus()
    } catch {
      setExtracting(false)
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/old/transactions"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar Transaksi
          </Link>
        </div>

        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
            <span>Langkah 2 dari 6</span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Unggah Dokumen Sumber</h1>
            <p className="mt-2 text-gray-600">
              Unggah file LC atau SKBDN untuk diekstraksi datanya secara otomatis oleh AI.
            </p>
          </div>

          {/* Amendment section */}
          {hasReviewedFields && (
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-5 space-y-3 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-amber-800">Unggah Amendemen</h2>
                <p className="mt-1 text-sm text-amber-700">
                  Dokumen sumber telah ditinjau sebelumnya. Unggah amendemen untuk memperbarui data.
                </p>
              </div>
              <DocumentUploader onUpload={handleAmendmentUpload} label="File Amendemen (LC/SKBDN)" />
              {amendmentUploading && (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-amber-600" />
                  <p className="text-sm text-amber-700">Sedang mengunggah amendemen...</p>
                </div>
              )}
              {amendmentSuccess && (
                <div className="rounded-md bg-green-50 border border-green-200 p-3">
                  <p className="text-sm text-green-700">Amendemen berhasil diunggah. Halaman akan dimuat ulang...</p>
                </div>
              )}
            </div>
          )}

          {/* Standard upload */}
          {!hasReviewedFields && (
            <DocumentUploader onUpload={handleUpload} label="Dokumen Sumber (LC/SKBDN)" />
          )}

          {/* Extract button */}
          {uploaded && !extracting && (
            <div className="mt-6">
              <button
                onClick={handleExtract}
                className="w-full rounded-lg bg-blue-600 px-4 py-3.5 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Ekstrak Data dari Dokumen
              </button>
            </div>
          )}

          {/* Extracting state */}
          {extracting && (
            <div className="mt-6 flex flex-col items-center gap-3 py-8 rounded-lg bg-blue-50 border border-blue-100">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm font-medium text-blue-700">Sedang mengekstrak data dari dokumen...</p>
              <p className="text-xs text-blue-500">Proses ini memerlukan beberapa saat</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Cancel link */}
        <div className="mt-4 text-center">
          <Link
            href="/old/transactions"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Batalkan dan kembali
          </Link>
        </div>
      </div>
    </div>
  )
}
