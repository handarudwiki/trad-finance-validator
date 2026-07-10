'use client'

import React, { useState, useRef, useEffect } from 'react'

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
    <header className="topbar" style={{ justifyContent: 'flex-end', padding: '0 1.5rem' }}>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 transition focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-1"
        >
          <span className="text-xs font-semibold">AD</span>
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-md shadow-md py-1 z-50">
            <div className="px-4 py-3 border-b border-zinc-100">
              <p className="text-sm font-semibold text-zinc-950">Admin Koperasi</p>
              <p className="text-xs text-zinc-500">admin@koperasi.id</p>
            </div>
            <div className="py-1">
              <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition">
                Profile Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition">
                Help & Support
              </button>
            </div>
            <div className="border-t border-zinc-100 py-1">
              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
