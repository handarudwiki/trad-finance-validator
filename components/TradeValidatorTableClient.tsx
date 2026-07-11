'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { TransactionStatus } from '@prisma/client'

interface TransactionItem {
  id: string
  type: string
  status: TransactionStatus
  createdAt: string
  updatedAt: string
}

interface TradeValidatorTableClientProps {
  initialTransactions: TransactionItem[]
  initialTotalItems: number
  initialLimit: number
}

const STATUS_LABELS: Record<TransactionStatus, string> = {
  DRAFT: 'Draft',
  EXTRACTION_REVIEW: 'Extraction Review',
  VALIDATING: 'Validating',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}

const STATUS_BADGE: Record<TransactionStatus, string> = {
  DRAFT: 'badge badge-draft',
  EXTRACTION_REVIEW: 'badge badge-review',
  VALIDATING: 'badge badge-validating',
  COMPLETED: 'badge badge-completed',
  FAILED: 'badge badge-failed',
}

function getTransactionLink(id: string, status: TransactionStatus): string {
  switch (status) {
    case 'DRAFT':
      return `/dashboard/trade-validator/${id}/upload`
    case 'EXTRACTION_REVIEW':
      return `/dashboard/trade-validator/${id}/review`
    case 'VALIDATING':
      return `/dashboard/trade-validator/${id}/validate`
    case 'COMPLETED':
    case 'FAILED':
      return `/dashboard/trade-validator/${id}/report`
    default:
      return `/dashboard/trade-validator/${id}/upload`
  }
}

function getActionLabel(status: TransactionStatus): string {
  switch (status) {
    case 'DRAFT': return 'Upload Docs'
    case 'EXTRACTION_REVIEW': return 'Review'
    case 'VALIDATING': return 'View Progress'
    case 'COMPLETED': return 'View Report'
    case 'FAILED': return 'View Error'
    default: return 'Open'
  }
}

export function TradeValidatorTableClient({
  initialTransactions,
  initialTotalItems,
  initialLimit
}: TradeValidatorTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // Filter form states
  const [filterType, setFilterType] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDate, setFilterDate] = useState('')
  const [filterUpdatedDate, setFilterUpdatedDate] = useState('')

  // Active filter states applied on "Terapkan"
  const [activeFilters, setActiveFilters] = useState({
    type: 'ALL',
    status: 'ALL',
    date: '',
    updatedDate: '',
  })

  // Pagination states
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)
  const [totalItems, setTotalItems] = useState(initialTotalItems)
  const [loading, setLoading] = useState(false)

  const isMounted = useRef(false)

  const fetchTransactions = async (
    targetPage: number,
    targetLimit: number,
    search: string,
    filters: typeof activeFilters
  ) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: String(targetPage),
        limit: String(targetLimit),
        search: search,
        type: filters.type,
        status: filters.status,
        date: filters.date,
        updatedDate: filters.updatedDate,
      })

      const res = await fetch(`/api/transactions?${queryParams.toString()}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions)
        setTotalItems(data.pagination.totalItems)
      }
    } catch (err) {
      console.error('Error fetching paginated transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Refetch when page changes
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    fetchTransactions(page, limit, searchQuery, activeFilters)
  }, [page])

  // Reset to page 1 and refetch when limit or filters change
  useEffect(() => {
    if (!isMounted.current) return
    setPage(1)
    fetchTransactions(1, limit, searchQuery, activeFilters)
  }, [limit, activeFilters])

  // Debounce search query input fetches
  useEffect(() => {
    if (!isMounted.current) return
    const timer = setTimeout(() => {
      setPage(1)
      fetchTransactions(1, limit, searchQuery, activeFilters)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleApplyFilters = () => {
    setActiveFilters({
      type: filterType,
      status: filterStatus,
      date: filterDate,
      updatedDate: filterUpdatedDate,
    })
    setIsFilterOpen(false) // Close panel on apply to let tags display cleanly
  }

  const handleResetFilters = () => {
    setFilterType('ALL')
    setFilterStatus('ALL')
    setFilterDate('')
    setFilterUpdatedDate('')
    setActiveFilters({
      type: 'ALL',
      status: 'ALL',
      date: '',
      updatedDate: '',
    })
  }

  const handleRemoveFilter = (key: 'type' | 'status' | 'date' | 'updatedDate') => {
    if (key === 'type') setFilterType('ALL')
    if (key === 'status') setFilterStatus('ALL')
    if (key === 'date') setFilterDate('')
    if (key === 'updatedDate') setFilterUpdatedDate('')

    setActiveFilters((prev) => ({
      ...prev,
      [key]: key === 'type' || key === 'status' ? 'ALL' : '',
    }))
  }

  const hasActiveFilters = 
    activeFilters.type !== 'ALL' || 
    activeFilters.status !== 'ALL' || 
    activeFilters.date !== '' || 
    activeFilters.updatedDate !== ''

  return (
    <div className="space-y-6"  >
      {/* Search & Filter Header Row */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari Transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-white border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition"
              style={{ borderRadius: '8px' }}
            />
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`btn btn-secondary h-10 px-4 flex items-center gap-2 ${isFilterOpen ? 'bg-zinc-50 border-zinc-950' : ''}`}
            style={{ borderRadius: '8px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterOpen && (
          <div className="p-4 border border-zinc-200 bg-white rounded-lg space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Filter Berdasarkan :</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type */}
              <div className="form-group mb-0">
                <label className="form-label text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Tipe</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="form-input text-xs font-semibold text-zinc-700"
                  style={{ borderRadius: '8px', height: '38px', fontSize: '12px' }}
                >
                  <option value="ALL">Pilih Tipe</option>
                  <option value="LC">LC</option>
                  <option value="SKBDN">SKBDN</option>
                </select>
              </div>

              {/* Status */}
              <div className="form-group mb-0">
                <label className="form-label text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-input text-xs font-semibold text-zinc-700"
                  style={{ borderRadius: '8px', height: '38px', fontSize: '12px' }}
                >
                  <option value="ALL">Pilih Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="EXTRACTION_REVIEW">Extraction Review</option>
                  <option value="VALIDATING">Validating</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Created Date */}
              <div className="form-group mb-0">
                <label className="form-label text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Tanggal Dibuat</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="form-input text-xs font-semibold text-zinc-700"
                  style={{ borderRadius: '8px', height: '38px', fontSize: '12px' }}
                />
              </div>

              {/* Updated Date */}
              <div className="form-group mb-0">
                <label className="form-label text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Tanggal Update</label>
                <input
                  type="date"
                  value={filterUpdatedDate}
                  onChange={(e) => setFilterUpdatedDate(e.target.value)}
                  className="form-input text-xs font-semibold text-zinc-700"
                  style={{ borderRadius: '8px', height: '38px', fontSize: '12px' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleApplyFilters}
                className="btn btn-primary h-9 px-4 text-xs font-semibold"
                style={{ borderRadius: '6px' }}
              >
                Terapkan
              </button>
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary h-9 px-4 text-xs font-semibold"
                style={{ borderRadius: '6px' }}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Row (Attachment 2 refactor) */}
        {hasActiveFilters && (
          <div className="flex items-center flex-wrap gap-2.5 py-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Filter Berdasarkan :</span>
            
            {activeFilters.type !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-3 h-8 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-md text-xs font-semibold">
                Tipe: {activeFilters.type}
                <button 
                  onClick={() => handleRemoveFilter('type')}
                  className="text-zinc-400 hover:text-zinc-900 transition focus:outline-none ml-0.5"
                  title="Remove Type filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </span>
            )}

            {activeFilters.status !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-3 h-8 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-md text-xs font-semibold">
                Status: {STATUS_LABELS[activeFilters.status]}
                <button 
                  onClick={() => handleRemoveFilter('status')}
                  className="text-zinc-400 hover:text-zinc-900 transition focus:outline-none ml-0.5"
                  title="Remove Status filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </span>
            )}

            {activeFilters.date && (
              <span className="inline-flex items-center gap-1.5 px-3 h-8 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-md text-xs font-semibold">
                Dibuat: {activeFilters.date}
                <button 
                  onClick={() => handleRemoveFilter('date')}
                  className="text-zinc-400 hover:text-zinc-900 transition focus:outline-none ml-0.5"
                  title="Remove Date filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </span>
            )}

            {activeFilters.updatedDate && (
              <span className="inline-flex items-center gap-1.5 px-3 h-8 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-md text-xs font-semibold">
                Update: {activeFilters.updatedDate}
                <button 
                  onClick={() => handleRemoveFilter('updatedDate')}
                  className="text-zinc-400 hover:text-zinc-900 transition focus:outline-none ml-0.5"
                  title="Remove Updated Date filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="btn btn-secondary h-8 px-4 text-xs font-semibold"
              style={{ borderRadius: '8px' }}
            >
              Atur Ulang
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center" style={{ backdropFilter: 'blur(1px)' }}>
            <span className="spinner spinner-dark" style={{ width: '28px', height: '28px', borderWidth: '2.5px' }} />
          </div>
        )}

        <div className="table-wrapper">
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  <path d="M12 8v4" />
                </svg>
              </div>
              <p className="empty-state-title">No transactions found</p>
              <p className="empty-state-desc">
                Try adjusting your search criteria or filter selections.
              </p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.25rem' }}>Transaction ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Updated</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <Link
                          href={getTransactionLink(tx.id, tx.status)}
                          className="table-id-link"
                          title={tx.id}
                        >
                          {tx.id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td>
                        <span className="badge-type">{tx.type}</span>
                      </td>
                      <td>
                        <span className={STATUS_BADGE[tx.status]}>
                          {STATUS_LABELS[tx.status]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {new Date(tx.updatedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ paddingRight: '1.25rem' }}>
                        <Link
                          href={getTransactionLink(tx.id, tx.status)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderRadius: '8px' }}
                        >
                          {getActionLabel(tx.status)}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination & Limit Section */}
              <div className="flex flex-col md:flex-row items-center justify-between border-t border-zinc-200 p-4 gap-4 text-xs font-semibold text-zinc-500 bg-white">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(parseInt(e.target.value, 10))
                        setPage(1)
                      }}
                      className="bg-white border border-zinc-200 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-zinc-950 text-xs font-semibold"
                      style={{ borderRadius: '6px' }}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span>entries</span>
                  </div>
                  
                  <span>
                    Showing {totalItems > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalItems)} of {totalItems} entries
                  </span>
                </div>

                {/* Page Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1 || loading}
                    className="btn btn-secondary h-8 px-3 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: '6px' }}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.ceil(totalItems / limit) }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === Math.ceil(totalItems / limit) || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-zinc-400">...</span>}
                          <button
                            onClick={() => setPage(p)}
                            className={`h-8 w-8 text-xs font-bold border flex items-center justify-center transition ${
                              p === page
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                            }`}
                            style={{ borderRadius: '6px' }}
                            disabled={loading}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      )
                    })
                  }

                  <button
                    onClick={() => setPage(p => Math.min(p + 1, Math.ceil(totalItems / limit)))}
                    disabled={page === Math.ceil(totalItems / limit) || totalItems === 0 || loading}
                    className="btn btn-secondary h-8 px-3 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: '6px' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
