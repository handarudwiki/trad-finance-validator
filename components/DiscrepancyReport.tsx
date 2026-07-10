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
    <div className="space-y-6">
      {/* Header Metadata */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Generated: {new Date(report.generatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
        </span>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-4 gap-4">
        {/* Fatal */}
        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
          <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
            <p className="text-2xl font-bold" style={{ color: report.summary.fatal > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {report.summary.fatal}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Fatal</p>
          </div>
        </div>

        {/* Major */}
        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
          <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
            <p className="text-2xl font-bold" style={{ color: report.summary.major > 0 ? '#d97706' : 'var(--text-primary)' }}>
              {report.summary.major}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Major</p>
          </div>
        </div>

        {/* Minor */}
        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
          <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
            <p className="text-2xl font-bold" style={{ color: report.summary.minor > 0 ? '#2563eb' : 'var(--text-primary)' }}>
              {report.summary.minor}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Minor</p>
          </div>
        </div>

        {/* Total */}
        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'none' }}>
          <div className="card-body" style={{ padding: '16px', textAlign: 'center' }}>
            <p className="text-2xl font-bold text-zinc-900">
              {report.summary.total}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Total Findings</p>
          </div>
        </div>
      </div>

      {/* Findings by Document */}
      {report.findingsByDocument.map((docGroup) => (
        <section key={docGroup.documentId} className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 border-b border-zinc-200 pb-2">
            {docGroup.documentType.split('_').join(' ')}
          </h3>
          <div className="space-y-3">
            {docGroup.findings.map((finding, idx) => (
              <FindingCard key={`${docGroup.documentId}-${idx}`} finding={finding} />
            ))}
          </div>
        </section>
      ))}

      {/* Cross-Document Findings */}
      {report.crossDocumentFindings.length > 0 && (
        <section className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 border-b border-zinc-200 pb-2">
            Cross-Document Findings
          </h3>
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
