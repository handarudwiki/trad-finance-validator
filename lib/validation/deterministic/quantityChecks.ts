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

  // Invoice extraction returns totalQuantity (string), not quantity
  // Packing List extraction also returns totalQuantity (string)
  const invoiceQuantity = invoiceData.totalQuantity ?? invoiceData.quantity
  const packingListQuantity = packingListData.totalQuantity ?? packingListData.quantity

  if (invoiceQuantity == null || packingListQuantity == null) {
    if (invoiceQuantity == null) {
      console.warn('[checkQuantity] Skipped: invoice totalQuantity/quantity is null')
    }
    if (packingListQuantity == null) {
      console.warn('[checkQuantity] Skipped: packingList totalQuantity/quantity is null')
    }
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
      expected: `${packingListQtyStr} (dari packing list)`,
      found: `${invoiceQtyStr} (dari invoice)`,
      description: `Kuantitas invoice "${invoiceQtyStr}" tidak sesuai dengan kuantitas packing list "${packingListQtyStr}".`,
      suggestedCorrection: `Pastikan kuantitas invoice dan packing list konsisten.`,
      regulatoryRef: 'UCP 600 Art. 14(d)',
      ragChunkIds: [],
    })
  }

  return findings
}
