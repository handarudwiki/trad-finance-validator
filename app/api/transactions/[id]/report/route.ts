/**
 * GET /api/transactions/[id]/report
 * Fetches the discrepancy report for a completed transaction.
 * Verifies transaction status is COMPLETED (409 otherwise).
 * Groups findings by supportingDocId and returns the structured report.
 * Satisfies: Requirements 10.1–10.6
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify transaction exists
  const transaction = await prisma.transaction.findUnique({ where: { id } })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  // Verify transaction status is COMPLETED
  if (transaction.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: `Report not available. Transaction status: ${transaction.status}` },
      { status: 409 }
    )
  }

  // Fetch discrepancy report with findings and supporting documents
  const report = await prisma.discrepancyReport.findUnique({
    where: { transactionId: id },
    include: {
      findings: {
        include: {
          supportingDoc: true,
        },
      },
    },
  })

  if (!report) {
    return NextResponse.json(
      { error: 'Discrepancy report not found' },
      { status: 404 }
    )
  }

  // Group findings by supportingDocId
  const findingsByDocumentMap = new Map<string, {
    documentId: string
    documentType: string
    findings: typeof report.findings
  }>()

  const crossDocumentFindings: typeof report.findings = []

  for (const finding of report.findings) {
    if (finding.supportingDocId && finding.supportingDoc) {
      const existing = findingsByDocumentMap.get(finding.supportingDocId)
      if (existing) {
        existing.findings.push(finding)
      } else {
        findingsByDocumentMap.set(finding.supportingDocId, {
          documentId: finding.supportingDocId,
          documentType: finding.supportingDoc.documentType,
          findings: [finding],
        })
      }
    } else {
      crossDocumentFindings.push(finding)
    }
  }

  const findingsByDocument = Array.from(findingsByDocumentMap.values())

  return NextResponse.json(
    {
      reportId: report.id,
      generatedAt: report.generatedAt.toISOString(),
      summary: report.summary,
      findingsByDocument,
      crossDocumentFindings,
    },
    { status: 200 }
  )
}
