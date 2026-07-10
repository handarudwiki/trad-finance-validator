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

  const invoiceAmount = invoiceData.amount
  if (invoiceAmount == null || typeof invoiceAmount !== 'number') {
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
      expected: `<= ${maxAllowedAmount} (LC amount ${lcAmount} + tolerance ${tolerancePct}%)`,
      found: String(invoiceAmount),
      description: `Invoice amount ${invoiceAmount} exceeds the maximum allowed amount of ${maxAllowedAmount} (LC amount ${lcAmount} with ${tolerancePct}% tolerance).`,
      suggestedCorrection: `Reduce invoice amount to not exceed ${maxAllowedAmount}.`,
      regulatoryRef: 'UCP 600 Art. 14(b)',
      ragChunkIds: [],
    })
  }

  return findings
}
