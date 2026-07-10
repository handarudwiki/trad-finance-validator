/**
 * Document-type validator registry.
 * Provides a factory function that returns the appropriate validator for a given document type.
 * Satisfies: Requirements 7.2–7.8, 8.6–8.9
 */

import type { DocumentValidator } from '@/lib/validation/validators/base'
import { InvoiceValidator } from '@/lib/validation/validators/invoiceValidator'
import { PackingListValidator } from '@/lib/validation/validators/packingListValidator'
import { BillOfLadingValidator } from '@/lib/validation/validators/billOfLadingValidator'
import { AirwayBillValidator } from '@/lib/validation/validators/airwayBillValidator'
import { CertificateOfOriginValidator } from '@/lib/validation/validators/certificateOfOriginValidator'
import { InsuranceCertificateValidator } from '@/lib/validation/validators/insuranceCertificateValidator'
import { GenericCertificateValidator } from '@/lib/validation/validators/genericCertificateValidator'

export type { DocumentValidator } from '@/lib/validation/validators/base'

/**
 * Returns the appropriate document validator for the given document type.
 * Returns null if no specific validator is defined for the document type.
 *
 * @param documentType - The type of document to validate (matches DocumentType enum)
 * @returns The appropriate DocumentValidator instance, or null if no validator applies
 */
export function getValidator(documentType: string): DocumentValidator | null {
  switch (documentType) {
    case 'COMMERCIAL_INVOICE':
      return new InvoiceValidator()

    case 'PACKING_LIST':
      return new PackingListValidator()

    case 'BILL_OF_LADING':
      return new BillOfLadingValidator()

    case 'AIRWAY_BILL':
      return new AirwayBillValidator()

    case 'CERTIFICATE_OF_ORIGIN':
      return new CertificateOfOriginValidator()

    case 'INSURANCE_CERTIFICATE':
      return new InsuranceCertificateValidator()

    case 'INSPECTION_CERTIFICATE':
    case 'BENEFICIARY_CERTIFICATE':
    case 'CERTIFICATE_OF_ANALYSIS':
    case 'PHYTOSANITARY_CERTIFICATE':
      return new GenericCertificateValidator(documentType)

    default:
      return null
  }
}
