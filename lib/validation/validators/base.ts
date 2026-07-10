/**
 * Base interface for document-type validators.
 * Each validator implements this interface to combine deterministic + interpretive checks
 * relevant to its document type.
 * Satisfies: Requirements 7.2–7.8, 8.6–8.9
 */

import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'

export interface DocumentValidator {
  validate(
    lcFields: ExtractedLCFields,
    docData: Record<string, unknown>,
    transactionType: 'LC' | 'SKBDN',
  ): Promise<Finding[]>
}
