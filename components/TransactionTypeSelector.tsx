'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TransactionType = 'LC' | 'SKBDN'

interface TypeOption {
  value: TransactionType
  title: string
  description: string
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: 'LC',
    title: 'LC (Letter of Credit)',
    description:
      'Kredit berdokumen internasional yang diatur oleh UCP 600 dan ISBP 745. Digunakan untuk transaksi perdagangan luar negeri.',
  },
  {
    value: 'SKBDN',
    title: 'SKBDN (Surat Kredit Berdokumen Dalam Negeri)',
    description:
      'Kredit berdokumen domestik yang diatur oleh PBI No. 5/6/PBI/2003. Digunakan untuk transaksi perdagangan dalam negeri.',
  },
]

export function TransactionTypeSelector() {
  const router = useRouter()
  const [selected, setSelected] = useState<TransactionType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selected) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selected }),
      })

      console.log(response)

      if (!response.ok) {
        if (response.status === 400) {
          const data = await response.json()
          setError(data.error || 'Tipe transaksi tidak valid. Pilih LC atau SKBDN.')
        } else {
          setError('Terjadi kesalahan saat membuat transaksi. Silakan coba lagi.')
        }
        return
      }

      const data = await response.json()
      router.push(`/old/transactions/${data.id}/upload`)
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Buat Transaksi Baru</h2>
      <p className="text-gray-600 mb-6">
        Pilih jenis instrumen kredit berdokumen yang akan divalidasi.
      </p>

      <div className="space-y-4 mb-6">
        {TYPE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`block cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              selected === option.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="transactionType"
                value={option.value}
                checked={selected === option.value}
                onChange={() => {
                  setSelected(option.value)
                  setError(null)
                }}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <div>
                <span className="font-semibold text-gray-900">{option.title}</span>
                <p className="mt-1 text-sm text-gray-500">{option.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected || isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
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
            Membuat transaksi...
          </span>
        ) : (
          'Buat Transaksi'
        )}
      </button>
    </div>
  )
}
