'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function TopBar(props: any) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="topbar">

      {/* Center Section - Search Bar */}
      <div className="flex-1 flex justify-center max-w-md mx-4">
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
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition"
          />
        </div>
      </div>

      {/* Right Section - Profile with Name, Role, & Dropdown */}
      <div className="flex-1 flex justify-end">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-zinc-50 transition focus:outline-none"
          >
            {/* Avatar Circle */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 text-xs font-semibold select-none">
              AD
            </div>
            {/* User Details */}
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-zinc-950 leading-tight">Admin Koperasi</p>
              <p className="text-[10px] text-zinc-400 leading-none mt-0.5 font-medium">Auditor</p>
            </div>
            {/* Chevron Icon */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400 ml-1">
              <path d="m6 9 6 6 6-6" />
            </svg>
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
