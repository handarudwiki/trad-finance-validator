'use client'

import { TopBar } from '@/components/layout/TopBar'

export default function UserManagementPage() {
  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: 'Trade Validator', href: '/dashboard/trade-validator' },
          { label: 'User Management' },
        ]}
      />

      <div className="dashboard-content">
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage cooperative staff roles and permissions.</p>
          </div>
        </div>

        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
          <div className="card-body py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-950 mb-1">Feature coming soon</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Staff management, user roles, and fine-grained access control interfaces are being prepared for the next cooperative audit release.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
