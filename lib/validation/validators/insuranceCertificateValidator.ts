/**
 * Insurance Certificate document validator.
 * Performs interpretive check (insurance coverage) for INSURANCE_CERTIFICATE documents.
 * Satisfies: Requirements 8.9
 */

import type { DocumentValidator } from '@/lib/validation/validators/base'
import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { insuranceCoverageCheck } from '@/lib/validation/interpretive/insuranceCoverageCheck'

export class InsuranceCertificateValidator implements DocumentValidator {
  async validate(
    lcFields: ExtractedLCFields,
    docData: Record<string, unknown>,
    transactionType: 'LC' | 'SKBDN',
  ): Promise<Finding[]> {
    // Interpretive check: insurance coverage compliance
    return insuranceCoverageCheck(lcFields, docData, transactionType)
  }
}
