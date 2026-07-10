'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TransactionType = 'LC' | 'SKBDN'

const TYPE_OPTIONS = [
  {
    value: 'LC' as TransactionType,
    title: 'LC — Letter of Credit',
    description:
      'International documentary credit governed by UCP 600 and ISBP 745. Used for cross-border trade transactions.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    value: 'SKBDN' as TransactionType,
    title: 'SKBDN — Surat Kredit Berdokumen Dalam Negeri',
    description:
      'Domestic documentary credit governed by PBI No. 5/6/PBI/2003. Used for domestic trade transactions in Indonesia.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
]

export function NewTransactionForm() {
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

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Failed to create transaction. Please try again.')
        return
      }

      const data = await response.json()
      router.push(`/dashboard/trade-validator/${data.id}/upload`)
    } catch {
      setError('Unable to connect to server. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Title description - compact */}
      <p className="text-zinc-500 text-sm">
        Choose the type of documentary credit instrument to begin validation.
      </p>

      {/* Selectable Options List */}
      <div className="flex flex-col gap-2.5">
        {TYPE_OPTIONS.map((option) => {
          const isSelected = selected === option.value
          return (
            <label
              key={option.value}
              className="flex items-start gap-3 p-3.5 border bg-white cursor-pointer transition select-none"
              style={{
                borderRadius: '8px',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--surface-hover)' : 'var(--surface)',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <input
                type="radio"
                name="transactionType"
                value={option.value}
                checked={isSelected}
                onChange={() => { setSelected(option.value); setError(null) }}
                disabled={isLoading}
                className="hidden"
              />
              
              {/* Minimalist Icon container */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center border transition"
                style={{
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  color: isSelected ? 'var(--surface)' : 'var(--text-secondary)',
                  borderRadius: '6px'
                }}
              >
                {option.icon}
              </div>

              {/* Title & Desc */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-zinc-950">
                  {option.title}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 leading-normal">
                  {option.description}
                </p>
              </div>

              {/* Check Indicator */}
              {isSelected && (
                <div className="flex-shrink-0 text-zinc-950 mt-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </label>
          )
        })}
      </div>

      {error && (
        <div className="alert alert-error py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Taller action button matching search bar h-10 */}
      <button
        onClick={handleSubmit}
        disabled={!selected || isLoading}
        className="btn btn-primary h-10 w-full flex items-center justify-center gap-2 text-sm font-semibold"
        style={{ borderRadius: '8px' }}
      >
        {isLoading ? (
          <>
            <span className="spinner w-4 h-4" />
            <span>Creating transaction…</span>
          </>
        ) : (
          <>
            <span>Start Validation</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}
