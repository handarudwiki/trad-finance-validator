/**
 * Bill of Lading document validator.
 * Performs deterministic checks (on-board date, presentation period)
 * for BILL_OF_LADING documents.
 * Satisfies: Requirements 7.5, 7.6, 7.8
 */

import type { DocumentValidator } from '@/lib/validation/validators/base'
import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { checkOnBoardDate, checkPresentationPeriod } from '@/lib/validation/deterministic/dateChecks'

export class BillOfLadingValidator implements DocumentValidator {
  async validate(
    lcFields: ExtractedLCFields,
    docData: Record<string, unknown>,
    _transactionType: 'LC' | 'SKBDN',
  ): Promise<Finding[]> {
    const findings: Finding[] = []

    // Deterministic checks
    findings.push(...checkOnBoardDate(docData, lcFields))
    findings.push(...checkPresentationPeriod(docData, lcFields))

    return findings
  }
}
