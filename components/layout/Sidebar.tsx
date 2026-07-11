'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_SECTIONS = [
  {
    title: 'overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Trade',
    items: [
      {
        label: 'Doc Validator',
        href: '/dashboard/trade-validator',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'management',
    items: [
      {
        label: 'User Management',
        href: '/dashboard/user-management',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'miscellinous',
    items: [
      {
        label: 'Storage',
        href: '/dashboard/storage',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
          </svg>
        ),
      },
      {
        label: 'Setup Application',
        href: '/dashboard/setup',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
]

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void
}

export function Sidebar({ onCollapseChange }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Header */}
      <div 
        className="sidebar-header flex items-center justify-between" 
        style={{ 
          padding: collapsed ? '0 12px' : '0 20px', 
          justifyContent: collapsed ? 'center' : 'space-between' 
        }}
      >
        {collapsed ? (
          <button
            onClick={() => {
              const next = !collapsed
              setCollapsed(next)
              onCollapseChange?.(next)
            }}
            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition shrink-0"
            title="Expand sidebar"
            style={{ borderRadius: '6px', background: 'var(--surface)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <div className="sidebar-logo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="sidebar-brand">Trade Validator</span>
            </div>
            <button
              onClick={() => {
                const next = !collapsed
                setCollapsed(next)
                onCollapseChange?.(next)
              }}
              className="p-1.5 hover:bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition shrink-0"
              title="Collapse sidebar"
              style={{ borderRadius: '6px', background: 'var(--surface)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-label">{section.title}</div>
            <div className="sidebar-section-items">
              {section.items.map((item) => {
                // Exact match for dashboard home, otherwise matching start path
                const isActive = item.href === '/dashboard' 
                  ? pathname === '/dashboard' 
                  : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item${isActive ? ' active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    <span className="sidebar-item-label">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer — Profile */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--sidebar-border)', padding: collapsed ? '12px 8px' : '12px 16px' }}>
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-white text-xs font-semibold select-none shrink-0"
            title="Admin Koperasi"
          >
            AD
          </div>
          {!collapsed && (
            <div className="text-left overflow-hidden">
              <p className="text-xs font-bold text-zinc-900 truncate leading-tight">Admin Koperasi</p>
              <p className="text-[10px] text-zinc-400 truncate leading-none mt-1 font-semibold uppercase tracking-wider">Auditor</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
