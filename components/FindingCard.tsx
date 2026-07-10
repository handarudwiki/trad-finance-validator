import type { Finding } from '@/schema/finding'

interface FindingCardProps {
  finding: Finding
}

const SEVERITY_CONFIG = {
  FATAL: {
    label: 'Fatal',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
  },
  MAJOR: {
    label: 'Besar',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
  },
  MINOR: {
    label: 'Kecil',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
  },
} as const

/**
 * Displays a single finding with severity badge, field details, and regulatory reference.
 * Satisfies: Requirements 10.3, 10.6
 */
export function FindingCard({ finding }: FindingCardProps) {
  const severity = SEVERITY_CONFIG[finding.severity]

  return (
    <div className={`rounded-lg border ${severity.borderColor} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {finding.field}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${severity.bgColor} ${severity.textColor}`}
        >
          {severity.label}
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-800">{finding.description}</p>

      {(finding.expected || finding.found) && (
        <div className="mb-3 grid grid-cols-2 gap-3">
          {finding.expected && (
            <div className="rounded bg-green-50 p-2">
              <span className="block text-xs font-medium text-green-700">
                Diharapkan
              </span>
              <span className="text-sm text-green-900">{finding.expected}</span>
            </div>
          )}
          {finding.found && (
            <div className="rounded bg-red-50 p-2">
              <span className="block text-xs font-medium text-red-700">
                Ditemukan
              </span>
              <span className="text-sm text-red-900">{finding.found}</span>
            </div>
          )}
        </div>
      )}

      {finding.suggestedCorrection && (
        <div className="mb-3 rounded bg-blue-50 p-2">
          <span className="block text-xs font-medium text-blue-700">
            Saran Koreksi
          </span>
          <span className="text-sm text-blue-900">
            {finding.suggestedCorrection}
          </span>
        </div>
      )}

      <div className="border-t border-gray-100 pt-2">
        <span className="text-xs text-gray-500">Referensi Regulasi: </span>
        <span className="text-xs font-medium text-gray-700">
          {finding.regulatoryRef}
        </span>
      </div>
    </div>
  )
}
