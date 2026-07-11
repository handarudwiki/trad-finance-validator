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

  // Extraction prompts return different date field names per document type:
  // Invoice → invoiceDate, Packing List → packingListDate, B/L → blDate, AWB → awbDate
  const docDate = docData.invoiceDate ?? docData.packingListDate ?? docData.blDate ?? docData.awbDate ?? docData.date
  if (docDate == null || typeof docDate !== 'string') {
    console.warn('[checkDocumentDate] Skipped: no valid date field found (checked invoiceDate, packingListDate, blDate, awbDate, date)')
    return findings
  }

  const expiryDate = lcFields.expiryDate

  if (docDate > expiryDate) {
    findings.push({
      checkType: 'DETERMINISTIC',
      severity: 'FATAL',
      field: 'date',
      expected: `<= ${expiryDate} (tanggal berakhir LC)`,
      found: docDate,
      description: `Tanggal dokumen ${docDate} melebihi tanggal berakhir LC ${expiryDate}.`,
      suggestedCorrection: `Pastikan tanggal dokumen tidak melebihi ${expiryDate}.`,
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
    console.warn('[checkOnBoardDate] Skipped: onBoardDate is null or not a string')
    return findings
  }

  const latestShipmentDate = lcFields.latestShipmentDate

  if (onBoardDate > latestShipmentDate) {
    findings.push({
      checkType: 'DETERMINISTIC',
      severity: 'FATAL',
      field: 'onBoardDate',
      expected: `<= ${latestShipmentDate} (tanggal pengiriman terakhir)`,
      found: onBoardDate,
      description: `Tanggal on-board ${onBoardDate} melebihi tanggal pengiriman terakhir ${latestShipmentDate}.`,
      suggestedCorrection: `Pastikan tanggal on-board tidak melebihi ${latestShipmentDate}.`,
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

  // B/L extraction returns blDate, AWB returns awbDate
  const blDate = blData.blDate ?? blData.awbDate ?? blData.date
  if (blDate == null || typeof blDate !== 'string') {
    console.warn('[checkPresentationPeriod] Skipped: blDate/awbDate is null or not a string')
    return findings
  }

  const presentationPeriodDays = lcFields.presentationPeriodDays
  if (presentationPeriodDays == null) {
    console.warn('[checkPresentationPeriod] Skipped: LC presentationPeriodDays is null')
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
      expected: `<= ${expiryDate} (tanggal berakhir LC)`,
      found: `${presentationDeadline} (tanggal B/L ${blDate} + ${presentationPeriodDays} hari)`,
      description: `Batas waktu penyerahan dokumen ${presentationDeadline} (tanggal B/L ${blDate} + ${presentationPeriodDays} hari) melebihi tanggal berakhir LC ${expiryDate}.`,
      suggestedCorrection: `Pastikan dokumen diserahkan dalam ${presentationPeriodDays} hari dari tanggal B/L dan sebelum tanggal berakhir LC ${expiryDate}.`,
      regulatoryRef: 'UCP 600 Art. 14(c)',
      ragChunkIds: [],
    })
  }

  return findings
}
