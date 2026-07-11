/**
 * Deterministic amount validation check.
 * Validates invoice amount against LC/SKBDN amount plus permitted tolerance.
 * Satisfies: Requirements 7.1, 7.2, 7.8
 */

import type { Finding } from '@/schema/finding'
import type { ExtractedLCFields } from '@/schema/extraction'

/**
 * Checks that invoice amount does not exceed LC amount plus tolerance.
 * Returns FATAL Finding if invoice amount > lcAmount * (1 + tolerancePct/100).
 */
export function checkAmount(
  invoiceData: Record<string, unknown>,
  lcFields: ExtractedLCFields,
): Finding[] {
  const findings: Finding[] = []

  // Invoice extraction returns totalAmount at root level, not .amount
  // Fallback to summing lineItems[].amount if totalAmount is null
  let invoiceAmount: number | null = null

  if (invoiceData.totalAmount != null && typeof invoiceData.totalAmount === 'number') {
    invoiceAmount = invoiceData.totalAmount
  } else if (Array.isArray(invoiceData.lineItems)) {
    const sum = (invoiceData.lineItems as Array<Record<string, unknown>>).reduce(
      (acc, item) => {
        const itemAmount = item.amount
        return acc + (typeof itemAmount === 'number' ? itemAmount : 0)
      },
      0,
    )
    if (sum > 0) {
      invoiceAmount = sum
    }
  }

  if (invoiceAmount == null) {
    console.warn('[checkAmount] Skipped: invoice totalAmount is null and lineItems sum is 0 or unavailable')
    return findings
  }

  const lcAmount = lcFields.amount
  const tolerancePct = lcFields.tolerancePct ?? 0
  const maxAllowedAmount = lcAmount * (1 + tolerancePct / 100)

  if (invoiceAmount > maxAllowedAmount) {
    findings.push({
      checkType: 'DETERMINISTIC',
      severity: 'FATAL',
      field: 'amount',
      expected: `<= ${maxAllowedAmount} (jumlah LC ${lcAmount} + toleransi ${tolerancePct}%)`,
      found: String(invoiceAmount),
      description: `Jumlah invoice ${invoiceAmount} melebihi batas maksimum ${maxAllowedAmount} (jumlah LC ${lcAmount} dengan toleransi ${tolerancePct}%).`,
      suggestedCorrection: `Kurangi jumlah invoice agar tidak melebihi ${maxAllowedAmount}.`,
      regulatoryRef: 'UCP 600 Art. 14(b)',
      ragChunkIds: [],
    })
  }

  return findings
}
