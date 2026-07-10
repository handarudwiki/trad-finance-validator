/**
 * Cross-document consistency validator.
 * Checks that shared data fields are consistent across all supporting documents.
 * Satisfies: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import type { Finding } from '@/schema/finding'

/** Document type keys used in the cross-document checks */
type DocumentType =
  | 'BILL_OF_LADING'
  | 'PACKING_LIST'
  | 'INSURANCE_CERTIFICATE'
  | 'COMMERCIAL_INVOICE'

/** Human-readable labels for document types used in finding descriptions */
const DOC_LABELS: Record<DocumentType, string> = {
  BILL_OF_LADING: 'Bill of Lading',
  PACKING_LIST: 'Packing List',
  INSURANCE_CERTIFICATE: 'Insurance Certificate',
  COMMERCIAL_INVOICE: 'Commercial Invoice',
}

/**
 * Normalizes a value to a comparable string.
 * Arrays are sorted and joined; numbers and strings are trimmed and lowercased.
 */
function normalize(value: unknown): string | null {
  if (value == null) return null

  if (Array.isArray(value)) {
    const sorted = value
      .map((v) => String(v).trim().toLowerCase())
      .filter((v) => v.length > 0)
      .sort()
    return sorted.length > 0 ? sorted.join(',') : null
  }

  const str = String(value).trim().toLowerCase()
  return str.length > 0 ? str : null
}

/**
 * Checks a field across multiple document types for consistency.
 * Compares all documents against the first document that has the field.
 * Returns findings for each mismatch pair detected.
 */
function checkFieldConsistency(
  extractedDocs: Map<string, Record<string, unknown>>,
  field: string,
  docTypes: DocumentType[],
): Finding[] {
  const findings: Finding[] = []

  // Collect values from documents that are present and have the field
  const docValues: Array<{ docType: DocumentType; raw: unknown; normalized: string }> = []

  for (const docType of docTypes) {
    const docData = extractedDocs.get(docType)
    if (!docData) continue

    const rawValue = docData[field]
    const normalizedValue = normalize(rawValue)
    if (normalizedValue === null) continue

    docValues.push({ docType, raw: rawValue, normalized: normalizedValue })
  }

  // Need at least 2 documents with the field to compare
  if (docValues.length < 2) return findings

  // Compare each subsequent document against the first (reference)
  const reference = docValues[0]
  for (let i = 1; i < docValues.length; i++) {
    const current = docValues[i]
    if (reference.normalized !== current.normalized) {
      findings.push({
        checkType: 'CROSS_DOCUMENT',
        severity: 'MAJOR',
        field,
        expected: String(reference.raw),
        found: String(current.raw),
        description: `${field} mismatch between ${DOC_LABELS[reference.docType]} and ${DOC_LABELS[current.docType]}`,
        suggestedCorrection: `Ensure ${field} is consistent across all relevant documents.`,
        regulatoryRef: 'UCP 600 Art. 14(d)',
        ragChunkIds: [],
      })
    }
  }

  return findings
}

/**
 * Runs all cross-document consistency checks over extracted supporting document data.
 * Skips checks gracefully when required document types are not present in the map.
 *
 * @param extractedDocs - Map keyed by DocumentType enum value to extracted data
 * @returns Array of Findings for any cross-document inconsistencies
 */
export function runCrossDocumentChecks(
  extractedDocs: Map<string, Record<string, unknown>>,
): Finding[] {
  const findings: Finding[] = []

  // Check container numbers across B/L, Packing List, Insurance Certificate (Req 9.2)
  findings.push(
    ...checkFieldConsistency(extractedDocs, 'containerNumbers', [
      'BILL_OF_LADING',
      'PACKING_LIST',
      'INSURANCE_CERTIFICATE',
    ]),
  )

  // Check total gross weight across Packing List, B/L, Insurance Certificate (Req 9.3)
  findings.push(
    ...checkFieldConsistency(extractedDocs, 'totalGrossWeight', [
      'PACKING_LIST',
      'BILL_OF_LADING',
      'INSURANCE_CERTIFICATE',
    ]),
  )

  // Check total quantity between Commercial Invoice and Packing List (Req 9.4)
  findings.push(
    ...checkFieldConsistency(extractedDocs, 'totalQuantity', [
      'COMMERCIAL_INVOICE',
      'PACKING_LIST',
    ]),
  )

  // Check port of loading between B/L and Insurance Certificate (Req 9.5)
  findings.push(
    ...checkFieldConsistency(extractedDocs, 'portOfLoading', [
      'BILL_OF_LADING',
      'INSURANCE_CERTIFICATE',
    ]),
  )

  // Check port of discharge between B/L and Insurance Certificate (Req 9.5)
  findings.push(
    ...checkFieldConsistency(extractedDocs, 'portOfDischarge', [
      'BILL_OF_LADING',
      'INSURANCE_CERTIFICATE',
    ]),
  )

  return findings
}
