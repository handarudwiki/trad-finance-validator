'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type TransactionType = 'LC' | 'SKBDN'

const TYPE_OPTIONS = [
  {
    value: 'LC' as TransactionType,
    title: 'LC — Letter of Credit',
    description:
      'International documentary credit governed by UCP 600 and ISBP 745. Used for cross-border trade transactions.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="flex flex-col items-start w-full">
      {/* Selectable Options List (Vertical Cards Grid) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px', 
          width: '100%', 
          maxWidth: '680px', 
          marginBottom: '28px' 
        }}
      >
        {TYPE_OPTIONS.map((option) => {
          const isSelected = selected === option.value
          return (
            <label
              key={option.value}
              className="relative flex flex-col items-center text-center p-6 border bg-white cursor-pointer transition select-none"
              style={{
                borderRadius: '8px',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--surface-hover)' : 'var(--surface)',
                opacity: isLoading ? 0.6 : 1,
                minHeight: '230px',
                justifyContent: 'center',
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
              
              {/* Centered Large Circular Icon container */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center border transition mb-4"
                style={{
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  background: isSelected ? 'var(--accent)' : '#F4F4F5',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                {option.icon}
              </div>

              {/* Title & Desc */}
              <h4 className="text-sm font-semibold text-zinc-950 mb-2">
                {option.title}
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
                {option.description}
              </p>

              {/* Top-Right Corner Circular Check Badge */}
              {isSelected && (
                <div 
                  className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: 'var(--accent)',
                    color: '#FFFFFF'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </label>
          )
        })}
      </div>

      {error && (
        <div className="alert alert-error py-2.5 mb-4 w-full max-w-[400px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Left-aligned actions section */}
      <div className="flex flex-col items-start gap-3">
        <button
          onClick={handleSubmit}
          disabled={!selected || isLoading}
          className="btn btn-primary h-10 px-8 flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ borderRadius: '8px', minWidth: '220px' }}
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

        <Link 
          href="/dashboard/trade-validator" 
          className="text-xs text-zinc-500 hover:text-zinc-950 transition font-medium py-1"
        >
          Back to list
        </Link>
      </div>
    </div>
  )
}
