'use client'

import { TopBar } from '@/components/layout/TopBar'

export default function SetupPage() {
  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: 'Trade Validator', href: '/dashboard/trade-validator' },
          { label: 'Setup Application' },
        ]}
      />

      <div className="dashboard-content">
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">Setup Application</h1>
            <p className="page-subtitle">Configure application settings, thresholds, and cooperative parameters.</p>
          </div>
        </div>

        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
          <div className="card-body py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-950 mb-1">Feature coming soon</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Threshold configurations, integration API keys, and model parameter tuning options will be available here.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
