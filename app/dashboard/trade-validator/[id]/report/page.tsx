import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DiscrepancyReport } from '@/components/DiscrepancyReport'
import { ReportExportButton } from '@/components/ReportExportButton'
import { TopBar } from '@/components/layout/TopBar'
import type { Finding } from '@/schema/finding'

interface ReportPageProps {
  params: Promise<{ id: string }>
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      discrepancyReport: {
        include: {
          findings: {
            include: { supportingDoc: true },
          },
        },
      },
    },
  })

  if (!transaction) redirect('/dashboard/trade-validator/new')

  // Failed state
  if (transaction.status === 'FAILED') {
    return (
      <>
        <TopBar
          breadcrumbs={[
            { label: 'Trade Validator', href: '/dashboard/trade-validator' },
            { label: `${transaction.type} · ${id.slice(0, 8)}…` },
            { label: 'Validation Failed' },
          ]}
          actions={
            <a href="/dashboard/trade-validator" className="btn btn-secondary h-10 px-4 flex items-center gap-2" style={{ borderRadius: '8px' }}>
              Back to List
            </a>
          }
        />
        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <h1 className="page-title" style={{ color: 'var(--danger)' }}>Validation Failed</h1>
              <p className="page-subtitle">The validation process encountered an error.</p>
            </div>
          </div>

          <div style={{ maxWidth: '640px' }}>
            <div className="card">
              <div className="card-header" style={{ background: 'var(--danger-subtle)', borderBottom: '1px solid #FECACA' }}>
                <span className="card-title" style={{ color: 'var(--danger)' }}>Error Details</span>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {transaction.errorDetails || 'An unknown error occurred during the validation process.'}
                </p>
                <div style={{ marginTop: '20px' }}>
                  <a
                    href={`/dashboard/trade-validator/${id}/upload`}
                    className="btn btn-primary h-10 px-4 flex items-center gap-2"
                    style={{ borderRadius: '8px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                    Retry Upload
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Redirect to appropriate step if not completed
  if (transaction.status !== 'COMPLETED') {
    switch (transaction.status) {
      case 'DRAFT': redirect(`/dashboard/trade-validator/${id}/upload`)
      case 'EXTRACTION_REVIEW': redirect(`/dashboard/trade-validator/${id}/review`)
      case 'VALIDATING': redirect(`/dashboard/trade-validator/${id}/validate`)
      default: redirect(`/dashboard/trade-validator/${id}/upload`)
    }
  }

  const report = transaction.discrepancyReport
  if (!report) redirect(`/dashboard/trade-validator/${id}/validate`)

  // Group findings by supporting document
  const findingsByDocument: Array<{
    documentId: string
    documentType: string
    findings: Finding[]
  }> = []
  const crossDocumentFindings: Finding[] = []

  for (const finding of report.findings) {
    const findingData: Finding = {
      checkType: finding.checkType as Finding['checkType'],
      severity: finding.severity as Finding['severity'],
      field: finding.field,
      expected: finding.expected,
      found: finding.found,
      description: finding.description,
      suggestedCorrection: finding.suggestedCorrection,
      regulatoryRef: finding.regulatoryRef,
      ragChunkIds: finding.ragChunkIds,
    }

    if (finding.checkType === 'CROSS_DOCUMENT' || !finding.supportingDocId) {
      crossDocumentFindings.push(findingData)
    } else {
      let docGroup = findingsByDocument.find((d) => d.documentId === finding.supportingDocId)
      if (!docGroup) {
        docGroup = {
          documentId: finding.supportingDocId!,
          documentType: finding.supportingDoc?.documentType ?? 'Unknown',
          findings: [],
        }
        findingsByDocument.push(docGroup)
      }
      docGroup.findings.push(findingData)
    }
  }

  const reportData = {
    reportId: report.id,
    generatedAt: report.generatedAt.toISOString(),
    summary: report.summary as { fatal: number; major: number; minor: number; total: number },
    findingsByDocument,
    crossDocumentFindings,
  }

  return (
    <>
      <TopBar
        breadcrumbs={[
          { label: 'Trade Validator', href: '/dashboard/trade-validator' },
          { label: `${transaction.type} · ${id.slice(0, 8)}…` },
          { label: 'Discrepancy Report' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {transaction.type}
            </span>
            <ReportExportButton transactionId={id} />
          </div>
        }
      />

      <div className="dashboard-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Discrepancy Report</h1>
            <p className="page-subtitle">
              Validation complete — review all findings before submission to the bank.
            </p>
          </div>
        </div>

        <DiscrepancyReport report={reportData} />
      </div>
    </>
  )
}
