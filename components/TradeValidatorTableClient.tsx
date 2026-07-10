'use client'

import React, { useState } from 'react'
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

export function TradeValidatorTableClient({ initialTransactions }: TradeValidatorTableClientProps) {
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

  const handleApplyFilters = () => {
    setActiveFilters({
      type: filterType,
      status: filterStatus,
      date: filterDate,
      updatedDate: filterUpdatedDate,
    })
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

  // Filter logic
  const filteredTransactions = initialTransactions.filter((tx) => {
    const matchesSearch = tx.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = activeFilters.type === 'ALL' || tx.type === activeFilters.type
    const matchesStatus = activeFilters.status === 'ALL' || tx.status === activeFilters.status

    const txCreatedDate = new Date(tx.createdAt).toISOString().split('T')[0]
    const matchesCreatedDate = !activeFilters.date || txCreatedDate === activeFilters.date

    const txUpdatedDate = new Date(tx.updatedAt).toISOString().split('T')[0]
    const matchesUpdatedDate = !activeFilters.updatedDate || txUpdatedDate === activeFilters.updatedDate

    return matchesSearch && matchesType && matchesStatus && matchesCreatedDate && matchesUpdatedDate
  })

  const recordCount = filteredTransactions.length

  return (
    <div className="space-y-6">
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

        {/* Minimalist Filter Panel (Attachment 2 refactor) */}
        {isFilterOpen && (
          <div className="p-4 border border-zinc-200 bg-white rounded-lg space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Filter Berdasarkan :</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type */}
              <div className="form-group mb-0">
                <label className="form-label text-xs font-medium text-zinc-600">Tipe</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="form-input"
                  style={{ borderRadius: '8px', height: '38px' }}
                >
                  <option value="ALL">Pilih Tipe</option>
                  <option value="LC">LC</option>
                  <option value="SKBDN">SKBDN</option>
                </select>
              </div>

              {/* Status */}
              <div className="form-group mb-0">
                <label className="form-label text-xs font-medium text-zinc-600">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-input"
                  style={{ borderRadius: '8px', height: '38px' }}
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
                <label className="form-label text-xs font-medium text-zinc-600">Tanggal Dibuat</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="form-input"
                  style={{ borderRadius: '8px', height: '38px' }}
                />
              </div>

              {/* Updated Date */}
              <div className="form-group mb-0">
                <label className="form-label text-xs font-medium text-zinc-600">Tanggal Update</label>
                <input
                  type="date"
                  value={filterUpdatedDate}
                  onChange={(e) => setFilterUpdatedDate(e.target.value)}
                  className="form-input"
                  style={{ borderRadius: '8px', height: '38px' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleApplyFilters}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: '8px' }}
              >
                Terapkan
              </button>
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '8px' }}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table (Reverted to card wrapper but removed .card-header box) */}
      <div className="table-wrapper">
        {filteredTransactions.length === 0 ? (
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
              {filteredTransactions.map((tx) => (
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
        )}
      </div>
    </div>
  )
}
