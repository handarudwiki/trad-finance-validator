/**
 * Deterministic date validation checks.
 * Validates document dates against LC/SKBDN expiry, latest shipment, and presentation period.
 * Satisfies: Requirements 7.1, 7.4, 7.5, 7.6, 7.8
 */

import type { Finding } from '@/schema/finding'
import type { ExtractedLCFields } from '@/schema/extraction'

/**
 * Checks that document date does not exceed the LC expiry date.
 * Returns FATAL Finding if doc date > expiry date.
 */
export function checkDocumentDate(
  docData: Record<string, unknown>,
  lcFields: ExtractedLCFields,
): Finding[] {
  const findings: Finding[] = []

  const docDate = docData.date
  if (docDate == null || typeof docDate !== 'string') {
    return findings
  }

  const expiryDate = lcFields.expiryDate

  if (docDate > expiryDate) {
    findings.push({
      checkType: 'DETERMINISTIC',
      severity: 'FATAL',
      field: 'date',
      expected: `<= ${expiryDate} (LC expiry date)`,
      found: docDate,
      description: `Document date ${docDate} exceeds the LC expiry date ${expiryDate}.`,
      suggestedCorrection: `Ensure document date is on or before ${expiryDate}.`,
      regulatoryRef: 'UCP 600 Art. 14(c)',
      ragChunkIds: [],
    })
  }

  return findings
}

/**
 * Checks that the on-board date does not exceed the latest shipment date.
 * Returns FATAL Finding if on-board date > latest shipment date.
 */
export function checkOnBoardDate(
  blData: Record<string, unknown>,
  lcFields: ExtractedLCFields,
): Finding[] {
  const findings: Finding[] = []

  const onBoardDate = blData.onBoardDate
  if (onBoardDate == null || typeof onBoardDate !== 'string') {
    return findings
  }

  const latestShipmentDate = lcFields.latestShipmentDate

  if (onBoardDate > latestShipmentDate) {
    findings.push({
      checkType: 'DETERMINISTIC',
      severity: 'FATAL',
      field: 'onBoardDate',
      expected: `<= ${latestShipmentDate} (latest shipment date)`,
      found: onBoardDate,
      description: `On-board date ${onBoardDate} exceeds the latest shipment date ${latestShipmentDate}.`,
      suggestedCorrection: `Ensure on-board date is on or before ${latestShipmentDate}.`,
      regulatoryRef: 'UCP 600 Art. 43(a)',
      ragChunkIds: [],
    })
  }

  return findings
}

/**
 * Checks that the B/L date plus presentation period days does not exceed the LC expiry date.
 * Returns FATAL Finding if bl.date + presentationPeriodDays > expiryDate.
 */
export function checkPresentationPeriod(
  blData: Record<string, unknown>,
  lcFields: ExtractedLCFields,
): Finding[] {
  const findings: Finding[] = []

  const blDate = blData.date
  if (blDate == null || typeof blDate !== 'string') {
    return findings
  }

  const presentationPeriodDays = lcFields.presentationPeriodDays
  if (presentationPeriodDays == null) {
    return findings
  }

  const expiryDate = lcFields.expiryDate

  // Calculate the presentation deadline by adding presentationPeriodDays to the B/L date
  const blDateObj = new Date(blDate)
  blDateObj.setDate(blDateObj.getDate() + presentationPeriodDays)
  const presentationDeadline = blDateObj.toISOString().split('T')[0]

  if (presentationDeadline > expiryDate) {
    findings.push({
      checkType: 'DETERMINISTIC',
      severity: 'FATAL',
      field: 'presentationPeriod',
      expected: `<= ${expiryDate} (LC expiry date)`,
      found: `${presentationDeadline} (B/L date ${blDate} + ${presentationPeriodDays} days)`,
      description: `Presentation deadline ${presentationDeadline} (B/L date ${blDate} + ${presentationPeriodDays} days) exceeds the LC expiry date ${expiryDate}.`,
      suggestedCorrection: `Ensure documents are presented within ${presentationPeriodDays} days of B/L date and before the LC expiry date ${expiryDate}.`,
      regulatoryRef: 'UCP 600 Art. 14(c)',
      ragChunkIds: [],
    })
  }

  return findings
}
