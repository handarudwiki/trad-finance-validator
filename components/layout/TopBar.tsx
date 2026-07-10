'use clients'

import React from 'react'
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface TopBarProps {
  breadcrumbs: BreadcrumbItem[]
  actions?: React.ReactNode
}

export function TopBar({ breadcrumbs, actions }: TopBarProps) {
  return (
    <header className="topbar">
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="topbar-breadcrumb-sep" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              )}
              {isLast ? (
                <span className="topbar-breadcrumb-current">{crumb.label}</span>
              ) : crumb.href ? (
                <Link
                  href={crumb.href}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </React.Fragment>
          )
        })}
      </nav>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  )
}
