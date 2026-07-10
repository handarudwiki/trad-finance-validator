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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="card">
      <div className="card-header">
        <span className="card-title">Select Instrument Type</span>
      </div>
      <div className="card-body">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Choose the type of documentary credit instrument to be validated.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {TYPE_OPTIONS.map((option) => {
            const isSelected = selected === option.value
            return (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--accent-subtle)' : 'var(--surface)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'border-color var(--transition), background var(--transition)',
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
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    flexShrink: 0,
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius)',
                    background: isSelected ? 'var(--accent)' : '#F3F4F6',
                    color: isSelected ? 'white' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background var(--transition), color var(--transition)',
                  }}
                >
                  {option.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {option.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <div style={{ flexShrink: 0, color: 'var(--accent)', marginTop: '2px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </label>
            )
          })}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selected || isLoading}
          className="btn btn-primary btn-lg btn-full"
        >
          {isLoading ? (
            <>
              <span className="spinner" style={{ width: '16px', height: '16px' }} />
              Creating transaction…
            </>
          ) : (
            <>
              Start Validation
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
