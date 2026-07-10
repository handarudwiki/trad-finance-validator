/**
 * Packing List document validator.
 * Combines deterministic checks (date, quantity) and interpretive check (goods description)
 * for PACKING_LIST documents.
 * Satisfies: Requirements 7.4, 7.7, 7.8, 8.7
 */

import type { DocumentValidator } from '@/lib/validation/validators/base'
import type { ExtractedLCFields } from '@/schema/extraction'
import type { Finding } from '@/schema/finding'
import { checkDocumentDate } from '@/lib/validation/deterministic/dateChecks'
import { checkQuantity } from '@/lib/validation/deterministic/quantityChecks'
import { goodsDescriptionCheck } from '@/lib/validation/interpretive/goodsDescriptionCheck'

export class PackingListValidator implements DocumentValidator {
  /**
   * Optional invoice data for cross-checking quantity.
   * Set this before calling validate if invoice data is available.
   */
  private invoiceData: Record<string, unknown> | null = null

  /**
   * Sets the invoice data for quantity cross-check.
   */
  setInvoiceData(invoiceData: Record<string, unknown>): void {
    this.invoiceData = invoiceData
  }

  async validate(
    lcFields: ExtractedLCFields,
    docData: Record<string, unknown>,
    transactionType: 'LC' | 'SKBDN',
  ): Promise<Finding[]> {
    const findings: Finding[] = []

    // Deterministic checks
    findings.push(...checkDocumentDate(docData, lcFields))

    // Quantity check requires invoice data for comparison
    if (this.invoiceData) {
      findings.push(...checkQuantity(this.invoiceData, docData))
    }

    // Interpretive check: goods description consistency
    const docsMap = new Map<string, Record<string, unknown>>()
    docsMap.set('PACKING_LIST', docData)
    const interpretiveFindings = await goodsDescriptionCheck(
      lcFields,
      docsMap,
      transactionType,
    )
    findings.push(...interpretiveFindings)

    return findings
  }
}
