/**
 * Generic Certificate document validator.
 * Used for certificate documents that require mandatory wording checks:
 * INSPECTION_CERTIFICATE, BENEFICIARY_CERTIFICATE, CERTIFICATE_OF_ANALYSIS, PHYTOSANITARY_CERTIFICATE.
 * Satisfies: Requirements 8.8
 */

import type { DocumentValidator } from '@/lib/validation/validators/base'
import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { mandatoryWordingCheck } from '@/lib/validation/interpretive/mandatoryWordingCheck'

export class GenericCertificateValidator implements DocumentValidator {
  private documentType: string

  constructor(documentType: string) {
    this.documentType = documentType
  }

  async validate(
    lcFields: ExtractedLCFields,
    docData: Record<string, unknown>,
    transactionType: 'LC' | 'SKBDN',
  ): Promise<Finding[]> {
    // Interpretive check: mandatory wording compliance
    return mandatoryWordingCheck(lcFields, docData, this.documentType, transactionType)
  }
}
