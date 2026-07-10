import type { Finding } from '@/schema/finding'
import { FindingCard } from './FindingCard'

interface DocumentFindings {
  documentId: string
  documentType: string
  findings: Finding[]
}

interface ReportData {
  reportId: string
  generatedAt: string
  summary: {
    fatal: number
    major: number
    minor: number
    total: number
  }
  findingsByDocument: DocumentFindings[]
  crossDocumentFindings: Finding[]
}

interface DiscrepancyReportProps {
  report: ReportData
}

/**
 * Displays the full discrepancy report with summary counts and findings grouped by document.
 * Satisfies: Requirements 10.2, 10.3, 10.5, 10.6
 */
export function DiscrepancyReport({ report }: DiscrepancyReportProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Laporan Penyimpangan
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Dibuat pada:{' '}
          {new Date(report.generatedAt).toLocaleString('id-ID', {
            dateStyle: 'long',
            timeStyle: 'short',
          })}
        </p>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">
            {report.summary.fatal}
          </p>
          <p className="text-sm font-medium text-red-600">Fatal</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">
            {report.summary.major}
          </p>
          <p className="text-sm font-medium text-orange-600">Besar</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">
            {report.summary.minor}
          </p>
          <p className="text-sm font-medium text-yellow-600">Kecil</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">
            {report.summary.total}
          </p>
          <p className="text-sm font-medium text-gray-600">Total Temuan</p>
        </div>
      </div>

      {/* Findings by Document */}
      {report.findingsByDocument.map((docGroup) => (
        <section key={docGroup.documentId}>
          <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            {docGroup.documentType}
          </h2>
          <div className="space-y-3">
            {docGroup.findings.map((finding, idx) => (
              <FindingCard key={`${docGroup.documentId}-${idx}`} finding={finding} />
            ))}
          </div>
        </section>
      ))}

      {/* Cross-Document Findings */}
      {report.crossDocumentFindings.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Temuan Lintas Dokumen
          </h2>
          <div className="space-y-3">
            {report.crossDocumentFindings.map((finding, idx) => (
              <FindingCard key={`cross-${idx}`} finding={finding} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
