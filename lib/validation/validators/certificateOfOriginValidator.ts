/**
 * Certificate of Origin document validator.
 * Performs interpretive check (mandatory wording) for CERTIFICATE_OF_ORIGIN documents.
 * Satisfies: Requirements 8.8
 */

import type { DocumentValidator } from '@/lib/validation/validators/base'
import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { mandatoryWordingCheck } from '@/lib/validation/interpretive/mandatoryWordingCheck'

export class CertificateOfOriginValidator implements DocumentValidator {
  async validate(
    lcFields: ExtractedLCFields,
    docData: Record<string, unknown>,
    transactionType: 'LC' | 'SKBDN',
  ): Promise<Finding[]> {
    // Interpretive check: mandatory wording compliance
    return mandatoryWordingCheck(lcFields, docData, 'CERTIFICATE_OF_ORIGIN', transactionType)
  }
}
