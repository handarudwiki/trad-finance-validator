/**
 * Deterministic quantity validation check.
 * Validates invoice quantity matches packing list quantity.
 * Satisfies: Requirements 7.1, 7.7, 7.8
 */

import type { Finding } from '@/schema/finding'

/**
 * Checks that invoice quantity matches packing list quantity.
 * Returns MAJOR Finding if quantities differ.
 */
export function checkQuantity(
  invoiceData: Record<string, unknown>,
  packingListData: Record<string, unknown>,
): Finding[] {
  const findings: Finding[] = []

  const invoiceQuantity = invoiceData.quantity
  const packingListQuantity = packingListData.quantity

  if (invoiceQuantity == null || packingListQuantity == null) {
    return findings
  }

  // Normalize to strings for comparison
  const invoiceQtyStr = String(invoiceQuantity).trim()
  const packingListQtyStr = String(packingListQuantity).trim()

  if (invoiceQtyStr !== packingListQtyStr) {
    findings.push({
      checkType: 'DETERMINISTIC',
      severity: 'MAJOR',
      field: 'quantity',
      expected: `${packingListQtyStr} (from packing list)`,
      found: `${invoiceQtyStr} (from invoice)`,
      description: `Invoice quantity "${invoiceQtyStr}" does not match packing list quantity "${packingListQtyStr}".`,
      suggestedCorrection: `Ensure invoice and packing list quantities are consistent.`,
      regulatoryRef: 'UCP 600 Art. 14(d)',
      ragChunkIds: [],
    })
  }

  return findings
}
