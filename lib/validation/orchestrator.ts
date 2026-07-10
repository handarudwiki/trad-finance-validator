/**
 * Validation orchestrator.
 * Coordinates the full validation pipeline for a transaction:
 * extraction → per-document validation → cross-document checks → report generation.
 * Satisfies: Requirements 6.1, 6.2, 6.4, 7.1–7.8, 8.1–8.10, 9.1–9.6, 10.1, 10.2, 14.3, 14.4, 14.5
 */

import { prisma } from '@/lib/prisma'
import { extractSupportingDocument } from '@/lib/extraction/extractSupportingDocument'
import { readFile } from '@/lib/storage'
import { getValidator } from '@/lib/validation/validators'
import { runCrossDocumentChecks } from '@/lib/validation/crossDocument/consistencyValidator'
import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'

/**
 * Runs the full validation pipeline for a given transaction.
 *
 * Pipeline steps:
 * 1. Set status to VALIDATING
 * 2. Load transaction with source document and supporting docs
 * 3. Extract unextracted supporting documents in parallel (individual failures don't abort)
 * 4. Run per-document validators (deterministic + interpretive)
 * 5. Run cross-document consistency checks
 * 6. Compute summary and persist discrepancy report with all findings
 * 7. Set status to COMPLETED
 * 8. On unrecoverable error: set status to FAILED with errorDetails
 *
 * @param transactionId - The ID of the transaction to validate
 */
export async function runValidation(transactionId: string): Promise<void> {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: 'VALIDATING' },
  })

  try {
    // 1. Load transaction with source document and supporting docs
    const transaction = await prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { sourceDocument: true, supportingDocs: true },
    })

    const lcFields = transaction.sourceDocument!.reviewedFields as unknown as ExtractedLCFields
    const allFindings: (Finding & { supportingDocId?: string })[] = []

    // 2. Extract unextracted supporting docs in parallel
    const unextractedDocs = transaction.supportingDocs.filter(doc => !doc.extractedData)

    const extractionResults = await Promise.allSettled(
      unextractedDocs.map(async (doc) => {
        const buffer = await readFile(doc.filePath)
        const extracted = await extractSupportingDocument(
          buffer,
          doc.mimeType,
          doc.documentType as Parameters<typeof extractSupportingDocument>[2],
        )
        await prisma.supportingDocument.update({
          where: { id: doc.id },
          data: { extractedData: extracted as unknown as import('@prisma/client').Prisma.InputJsonValue, extractedAt: new Date() },
        })
        return { docId: doc.id, data: extracted }
      })
    )

    // Record FATAL findings for failed extractions
    for (const [i, result] of extractionResults.entries()) {
      if (result.status === 'rejected') {
        const doc = unextractedDocs[i]
        allFindings.push({
          checkType: 'DETERMINISTIC',
          severity: 'FATAL',
          field: 'extraction',
          description: `Document extraction failed for ${doc.documentType}: ${result.reason}`,
          regulatoryRef: 'N/A',
          ragChunkIds: [],
          supportingDocId: doc.id,
        })
      }
    }

    // 3. Reload docs with extracted data and run validators
    const updatedDocs = await prisma.supportingDocument.findMany({
      where: { transactionId },
    })

    const extractedDocsMap = new Map<string, Record<string, unknown>>()

    for (const doc of updatedDocs) {
      if (doc.extractedData) {
        const data = doc.extractedData as Record<string, unknown>
        extractedDocsMap.set(doc.documentType, data)

        const validator = getValidator(doc.documentType)
        if (validator) {
          const findings = await validator.validate(
            lcFields,
            data,
            transaction.type as 'LC' | 'SKBDN',
          )
          allFindings.push(...findings.map(f => ({ ...f, supportingDocId: doc.id })))
        }
      }
    }

    // 4. Cross-document checks
    const crossFindings = runCrossDocumentChecks(extractedDocsMap)
    allFindings.push(...crossFindings)

    // 5. Compute summary and persist
    const summary = {
      fatal: allFindings.filter(f => f.severity === 'FATAL').length,
      major: allFindings.filter(f => f.severity === 'MAJOR').length,
      minor: allFindings.filter(f => f.severity === 'MINOR').length,
      total: allFindings.length,
    }

    await prisma.discrepancyReport.create({
      data: {
        transactionId,
        summary,
        findings: {
          create: allFindings.map(f => ({
            checkType: f.checkType,
            severity: f.severity,
            field: f.field,
            expected: f.expected ?? null,
            found: f.found ?? null,
            description: f.description,
            suggestedCorrection: f.suggestedCorrection ?? null,
            regulatoryRef: f.regulatoryRef,
            ragChunkIds: f.ragChunkIds ?? [],
            supportingDocId: f.supportingDocId ?? null,
          })),
        },
      },
    })

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'COMPLETED' },
    })
  } catch (err) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'FAILED', errorDetails: String(err) },
    })
  }
}
