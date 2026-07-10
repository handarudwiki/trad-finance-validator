/**
 * Invoice document validator.
 * Combines deterministic checks (amount, currency, date) and interpretive check (goods description)
 * for COMMERCIAL_INVOICE documents.
 * Satisfies: Requirements 7.2, 7.3, 7.4, 7.8, 8.7
 */

import type { DocumentValidator } from '@/lib/validation/validators/base'
import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { checkAmount } from '@/lib/validation/deterministic/amountChecks'
import { checkCurrency } from '@/lib/validation/deterministic/currencyChecks'
import { checkDocumentDate } from '@/lib/validation/deterministic/dateChecks'
import { goodsDescriptionCheck } from '@/lib/validation/interpretive/goodsDescriptionCheck'

export class InvoiceValidator implements DocumentValidator {
  async validate(
    lcFields: ExtractedLCFields,
    docData: Record<string, unknown>,
    transactionType: 'LC' | 'SKBDN',
  ): Promise<Finding[]> {
    const findings: Finding[] = []

    // Deterministic checks
    findings.push(...checkAmount(docData, lcFields))
    findings.push(...checkCurrency(docData, lcFields))
    findings.push(...checkDocumentDate(docData, lcFields))

    // Interpretive check: goods description consistency
    const docsMap = new Map<string, Record<string, unknown>>()
    docsMap.set('COMMERCIAL_INVOICE', docData)
    const interpretiveFindings = await goodsDescriptionCheck(
      lcFields,
      docsMap,
      transactionType,
    )
    findings.push(...interpretiveFindings)

    return findings
  }
}
