'use client'

export default function StoragePage() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Storage & Documents</h1>
          <p className="page-subtitle">Manage historical document archives and cooperative templates.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body py-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-950 mb-1">Feature coming soon</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Persistent cloud storage, automatic versioning of coop records, and bulk export features are under development.
          </p>
        </div>
      </div>
    </div>
  )
}
