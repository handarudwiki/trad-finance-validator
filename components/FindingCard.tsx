import type { Finding } from '@/schema/finding'

interface FindingCardProps {
  finding: Finding
}

const SEVERITY_CONFIG = {
  FATAL: {
    label: 'Fatal',
    badgeClass: 'bg-red-50 text-red-700 border border-red-200',
  },
  MAJOR: {
    label: 'Major',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  MINOR: {
    label: 'Minor',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
} as const

/**
 * Displays a single finding with severity badge, field details, and regulatory reference.
 * Satisfies: Requirements 10.3, 10.6
 */
export function FindingCard({ finding }: FindingCardProps) {
  const severity = SEVERITY_CONFIG[finding.severity]

  return (
    <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
      <div className="card-body" style={{ padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            {finding.field}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${severity.badgeClass}`}
            style={{ borderRadius: '4px' }}
          >
            {severity.label}
          </span>
        </div>

        <p className="mb-4 text-xs font-medium text-zinc-800 leading-relaxed">{finding.description}</p>

        {(finding.expected || finding.found) && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {finding.expected && (
              <div className="bg-emerald-50/30 border border-emerald-100/80 p-2.5" style={{ borderRadius: '6px' }}>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                  Expected
                </span>
                <span className="text-xs font-medium text-emerald-950 block mt-1">{finding.expected}</span>
              </div>
            )}
            {finding.found && (
              <div className="bg-rose-50/30 border border-rose-100/80 p-2.5" style={{ borderRadius: '6px' }}>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-rose-700">
                  Found
                </span>
                <span className="text-xs font-medium text-rose-950 block mt-1">{finding.found}</span>
              </div>
            )}
          </div>
        )}

        {finding.suggestedCorrection && (
          <div className="mb-4 bg-zinc-50/50 border border-zinc-200/60 p-2.5" style={{ borderRadius: '6px' }}>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Suggested Correction
            </span>
            <span className="text-xs font-medium text-zinc-800 block mt-1">
              {finding.suggestedCorrection}
            </span>
          </div>
        )}

        <div className="border-t border-zinc-100 pt-2 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Regulatory Reference</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5" style={{ borderRadius: '4px' }}>
            {finding.regulatoryRef}
          </span>
        </div>
      </div>
    </div>
  )
}
