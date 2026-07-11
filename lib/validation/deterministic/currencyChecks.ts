/**
 * Deterministic currency validation check.
 * Validates invoice currency matches LC/SKBDN currency exactly.
 * Satisfies: Requirements 7.1, 7.3, 7.8
 */

import type { Finding } from '@/schema/finding'
import type { ExtractedLCFields } from '@/schema/extraction'

/**
 * Checks that invoice currency matches the LC currency exactly.
 * Returns FATAL Finding if currencies differ.
 */
export function checkCurrency(
  invoiceData: Record<string, unknown>,
  lcFields: ExtractedLCFields,
): Finding[] {
  const findings: Finding[] = []

  const invoiceCurrency = invoiceData.currency
  if (invoiceCurrency == null || typeof invoiceCurrency !== 'string') {
    console.warn('[checkCurrency] Skipped: invoice currency is null or not a string')
    return findings
  }

  const lcCurrency = lcFields.currency

  if (invoiceCurrency !== lcCurrency) {
    findings.push({
      checkType: 'DETERMINISTIC',
      severity: 'FATAL',
      field: 'currency',
      expected: lcCurrency,
      found: invoiceCurrency,
      description: `Mata uang invoice "${invoiceCurrency}" tidak sesuai dengan mata uang LC "${lcCurrency}".`,
      suggestedCorrection: `Perbaiki mata uang invoice menjadi "${lcCurrency}".`,
      regulatoryRef: 'UCP 600 Art. 14(b)',
      ragChunkIds: [],
    })
  }

  return findings
}
