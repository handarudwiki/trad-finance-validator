'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

const APP_FEATURES = [
  {
    name: 'New Validation / Transaction (Upload Document)',
    description: 'Start a new transaction validation process by uploading LC or SKBDN.',
    href: '/dashboard/trade-validator/new',
    keywords: ['new', 'create', 'upload', 'validation', 'transaction', 'lc', 'skbdn', 'tambah']
  },
  {
    name: 'Validation History / Transactions List',
    description: 'View the table of all trade finance transaction validations and audit reports.',
    href: '/dashboard/trade-validator',
    keywords: ['history', 'list', 'transactions', 'riwayat', 'daftar', 'report', 'laporan']
  },
  {
    name: 'Draft Transactions',
    description: 'Filter transaction history to view pending drafts and incomplete validation steps.',
    href: '/dashboard/trade-validator?status=DRAFT',
    keywords: ['draft', 'pending', 'tunda', 'proses']
  },
  {
    name: 'Completed Transactions & Reports',
    description: 'Filter transaction history to view successful validations and discrepancy reports.',
    href: '/dashboard/trade-validator?status=COMPLETED',
    keywords: ['completed', 'success', 'selesai', 'report', 'laporan', 'discrepancy']
  },
  {
    name: 'Under Review',
    description: 'Filter transaction history to view transactions currently in the extraction review stage.',
    href: '/dashboard/trade-validator?status=EXTRACTION_REVIEW',
    keywords: ['review', 'extraction', 'perlu tinjauan']
  },
  {
    name: 'User Profile & Settings',
    description: 'View your auditor account details and role permissions.',
    href: '/dashboard/profile',
    keywords: ['profile', 'user', 'settings', 'akun', 'profil']
  }
]

export function TopBar(props: any) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleClickOutsideSearch(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideSearch)
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch)
  }, [])

  const filteredFeatures = searchQuery.trim() === ''
    ? APP_FEATURES.slice(0, 3) // Quick Navigation defaults
    : APP_FEATURES.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredFeatures.length > 0) {
      window.location.href = filteredFeatures[0].href
      setIsSearchFocused(false)
      setSearchQuery('')
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false)
    }
  }

  return (
    <header className="topbar">

      {/* Center Section - Search Bar */}
      <div className="flex-1 flex justify-center max-w-md mx-4" ref={searchRef}>
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition"
          />

          {isSearchFocused && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-md py-2 z-50 max-h-80 overflow-y-auto" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
              <div className="px-3 pb-1 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {searchQuery.trim() === '' ? 'Quick Navigation' : 'Search Results'}
                </span>
                {searchQuery.trim() !== '' && (
                  <span className="text-[10px] text-zinc-400 font-semibold">
                    {filteredFeatures.length} found
                  </span>
                )}
              </div>

              {filteredFeatures.length > 0 ? (
                <div className="mt-1">
                  {filteredFeatures.map((feature, idx) => (
                    <Link
                      key={idx}
                      href={feature.href}
                      onClick={() => {
                        setSearchQuery('')
                        setIsSearchFocused(false)
                      }}
                      className="block px-4 py-2.5 hover:bg-zinc-50 transition text-left"
                    >
                      <p className="text-xs font-semibold text-zinc-900">{feature.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-medium leading-normal">{feature.description}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-zinc-400 text-[11px] font-medium">
                  No matching features found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Profile with Name, Role, & Dropdown */}
      <div className="flex-1 flex justify-end items-center gap-3">
        {/* Compact Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-zinc-50 transition focus:outline-none shrink-0"
            title="Profile Menu"
          >
            {/* User Details (left of avatar) */}
            <div className="text-right hidden md:block mr-0.5">
              <p className="text-xs font-semibold text-zinc-950 leading-tight">Admin Koperasi</p>
              <p className="text-[10px] text-zinc-400 leading-none mt-0.5 font-medium">Auditor</p>
            </div>
            {/* Avatar Circle (right of details) */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 text-xs font-semibold select-none shrink-0">
              AD
            </div>
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-md py-1 z-50">
              <Link 
                href="/dashboard/profile" 
                className="block w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
              <div className="border-t border-zinc-100 my-1"></div>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                onClick={() => {
                  setIsOpen(false)
                  // Handle logout logic if needed
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
