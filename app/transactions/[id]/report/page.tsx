import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DiscrepancyReport } from '@/components/DiscrepancyReport'
import { ReportExportButton } from '@/components/ReportExportButton'
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

  if (!transaction) {
    redirect('/transactions/new')
  }

  // Show error details if transaction failed
  if (transaction.status === 'FAILED') {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-red-700">Validasi Gagal</h1>
          <div className="rounded-md bg-red-50 border border-red-200 p-6">
            <p className="text-sm text-red-800 font-medium mb-2">Detail Kesalahan:</p>
            <p className="text-sm text-red-700">
              {transaction.errorDetails || 'Terjadi kesalahan yang tidak diketahui selama proses validasi.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to appropriate step if not completed
  if (transaction.status !== 'COMPLETED') {
    switch (transaction.status) {
      case 'DRAFT':
        redirect(`/transactions/${id}/upload`)
      case 'EXTRACTION_REVIEW':
        redirect(`/transactions/${id}/review`)
      case 'VALIDATING':
        redirect(`/transactions/${id}/validate`)
      default:
        redirect(`/transactions/${id}/upload`)
    }
  }

  const report = transaction.discrepancyReport
  if (!report) {
    redirect(`/transactions/${id}/validate`)
  }

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
          documentType: finding.supportingDoc?.documentType ?? 'Tidak Diketahui',
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
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Transaksi: {id} &middot; Tipe: {transaction.type}
            </p>
          </div>
          <ReportExportButton transactionId={id} />
        </div>

        <DiscrepancyReport report={reportData} />
      </div>
    </div>
  )
}
