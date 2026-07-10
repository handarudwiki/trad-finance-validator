/**
 * Airway Bill document validator.
 * Performs deterministic checks (on-board date, presentation period)
 * for AIRWAY_BILL documents. Uses the same date checks as Bill of Lading
 * since both are transport documents with on-board date and presentation period rules.
 * Satisfies: Requirements 7.5, 7.6, 7.8
 */

import type { DocumentValidator } from '@/lib/validation/validators/base'
import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { checkOnBoardDate, checkPresentationPeriod } from '@/lib/validation/deterministic/dateChecks'

export class AirwayBillValidator implements DocumentValidator {
  async validate(
    lcFields: ExtractedLCFields,
    docData: Record<string, unknown>,
    _transactionType: 'LC' | 'SKBDN',
  ): Promise<Finding[]> {
    const findings: Finding[] = []

    // Deterministic checks (same rules as B/L per UCP 600 Art. 23/Art. 43)
    findings.push(...checkOnBoardDate(docData, lcFields))
    findings.push(...checkPresentationPeriod(docData, lcFields))

    return findings
  }
}
