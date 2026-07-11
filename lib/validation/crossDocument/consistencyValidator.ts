/**
 * Cross-document consistency validator.
 * Checks that shared data fields are consistent across all supporting documents.
 * Includes unit normalization (kg↔mt, pcs↔pieces) and date format normalization.
 * Satisfies: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import type { Finding } from '@/schema/finding'

/** Document type keys used in the cross-document checks */
type DocumentType =
  | 'BILL_OF_LADING'
  | 'PACKING_LIST'
  | 'INSURANCE_CERTIFICATE'
  | 'COMMERCIAL_INVOICE'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'AIRWAY_BILL'

/** Human-readable labels for document types used in finding descriptions */
const DOC_LABELS: Record<string, string> = {
  BILL_OF_LADING: 'Bill of Lading',
  PACKING_LIST: 'Packing List',
  INSURANCE_CERTIFICATE: 'Sertifikat Asuransi',
  COMMERCIAL_INVOICE: 'Invoice Komersial',
  CERTIFICATE_OF_ORIGIN: 'Sertifikat Asal',
  AIRWAY_BILL: 'Airway Bill',
}

// --- Unit Normalization ---

/** Map of unit aliases to canonical form */
const UNIT_ALIASES: Record<string, string> = {
  'kg': 'kg',
  'kgs': 'kg',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'mt': 'mt',
  'metric ton': 'mt',
  'metric tons': 'mt',
  'metric tonne': 'mt',
  'metric tonnes': 'mt',
  'ton': 'mt',
  'tons': 'mt',
  'tonne': 'mt',
  'tonnes': 'mt',
  'pcs': 'pcs',
  'pc': 'pcs',
  'piece': 'pcs',
  'pieces': 'pcs',
  'unit': 'pcs',
  'units': 'pcs',
  'set': 'set',
  'sets': 'set',
  'carton': 'carton',
  'cartons': 'carton',
  'ctn': 'carton',
  'ctns': 'carton',
  'bag': 'bag',
  'bags': 'bag',
  'drum': 'drum',
  'drums': 'drum',
  'container': 'container',
  'containers': 'container',
  'cbm': 'cbm',
  'cubic meter': 'cbm',
  'cubic meters': 'cbm',
  'cubic metre': 'cbm',
  'cubic metres': 'cbm',
}

/**
 * Normalizes a quantity string by extracting numeric value and normalizing unit.
 * "5,000 MT" → "5000 mt", "500 Metric Tons" → "500 mt", "1000 KGS" → "1000 kg"
 */
function normalizeQuantity(value: unknown): string | null {
  if (value == null) return null
  const str = String(value).trim()
  if (!str) return null

  // Extract number and unit
  const match = str.match(/^([0-9,.\s]+)\s*(.*)$/)
  if (!match) return str.toLowerCase()

  const numPart = match[1].replace(/[,\s]/g, '').trim()
  const unitPart = match[2].trim().toLowerCase()

  const canonicalUnit = UNIT_ALIASES[unitPart] || unitPart
  return numPart ? `${numPart} ${canonicalUnit}`.trim() : str.toLowerCase()
}

/**
 * Normalizes a date string to YYYY-MM-DD format.
 * Handles: "2026-09-01", "01/09/2026", "Sep 1, 2026", "1 September 2026"
 */
function normalizeDate(value: unknown): string | null {
  if (value == null) return null
  const str = String(value).trim()
  if (!str) return null

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str

  // Try parsing with Date
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return str.toLowerCase()
}

/**
 * Normalizes a general value to a comparable string.
 * Trims, lowercases, removes extra spaces.
 */
function normalizeGeneral(value: unknown): string | null {
  if (value == null) return null

  if (Array.isArray(value)) {
    const sorted = value
      .map((v) => String(v).trim().toLowerCase().replace(/\s+/g, ' '))
      .filter((v) => v.length > 0)
      .sort()
    return sorted.length > 0 ? sorted.join(',') : null
  }

  const str = String(value).trim().toLowerCase().replace(/\s+/g, ' ')
  return str.length > 0 ? str : null
}

/**
 * Normalizes an amount value: removes formatting, converts to number string.
 */
function normalizeAmount(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'number') return String(value)
  const str = String(value).replace(/[,\s]/g, '').trim()
  const num = parseFloat(str)
  return isNaN(num) ? null : String(num)
}

type NormalizeFn = (value: unknown) => string | null

/**
 * Checks a field across multiple document types for consistency.
 * Uses the specified normalizer function for comparison.
 */
function checkFieldConsistency(
  extractedDocs: Map<string, Record<string, unknown>>,
  field: string,
  fieldAliases: string[],
  docTypes: string[],
  normalizeFn: NormalizeFn,
  severity: 'FATAL' | 'MAJOR' | 'MINOR' = 'MAJOR',
): Finding[] {
  const findings: Finding[] = []

  // Collect values from documents — check field and aliases
  const docValues: Array<{ docType: string; raw: unknown; normalized: string }> = []

  for (const docType of docTypes) {
    const docData = extractedDocs.get(docType)
    if (!docData) continue

    let rawValue: unknown = undefined
    for (const alias of [field, ...fieldAliases]) {
      if (docData[alias] != null) {
        rawValue = docData[alias]
        break
      }
    }

    const normalizedValue = normalizeFn(rawValue)
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
      const refLabel = DOC_LABELS[reference.docType] || reference.docType
      const curLabel = DOC_LABELS[current.docType] || current.docType
      findings.push({
        checkType: 'CROSS_DOCUMENT',
        severity,
        field,
        expected: String(reference.raw),
        found: String(current.raw),
        description: `Ketidaksesuaian ${field} antara ${refLabel} dan ${curLabel}.`,
        suggestedCorrection: `Pastikan ${field} konsisten di semua dokumen terkait.`,
        regulatoryRef: 'UCP 600 Art. 14(d)',
        ragChunkIds: [],
      })
    }
  }

  return findings
}

// All document types to check across
const ALL_DOC_TYPES: string[] = [
  'COMMERCIAL_INVOICE',
  'BILL_OF_LADING',
  'PACKING_LIST',
  'INSURANCE_CERTIFICATE',
  'CERTIFICATE_OF_ORIGIN',
  'AIRWAY_BILL',
]

/**
 * Runs all cross-document consistency checks over extracted supporting document data.
 *
 * Fields checked:
 * - Goods Description
 * - Shipment Date (on-board date / shipment date)
 * - Amount (invoice amount)
 * - Currency
 * - Beneficiary / Applicant names
 * - Marks & Numbers
 * - Vessel Name
 * - LC Number
 * - Quantity (with unit normalization: kg↔mt, pcs↔pieces)
 * - Ports (loading / discharge)
 * - Container numbers
 * - Gross weight
 *
 * @param extractedDocs - Map keyed by DocumentType enum value to extracted data
 * @returns Array of Findings for any cross-document inconsistencies
 */
export function runCrossDocumentChecks(
  extractedDocs: Map<string, Record<string, unknown>>,
): Finding[] {
  const findings: Finding[] = []

  // 1. Goods Description
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'goodsDescription', ['description', 'goods'],
      ALL_DOC_TYPES, normalizeGeneral, 'MAJOR',
    ),
  )

  // 2. Shipment Date / On-board Date
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'onBoardDate', ['shipmentDate', 'dateOfShipment', 'blDate'],
      ['BILL_OF_LADING', 'AIRWAY_BILL', 'INSURANCE_CERTIFICATE'],
      normalizeDate, 'MAJOR',
    ),
  )

  // 3. Invoice Amount
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'totalAmount', ['amount', 'invoiceAmount'],
      ['COMMERCIAL_INVOICE', 'INSURANCE_CERTIFICATE'],
      normalizeAmount, 'FATAL',
    ),
  )

  // 4. Currency
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'currency', ['currencyCode'],
      ALL_DOC_TYPES, normalizeGeneral, 'FATAL',
    ),
  )

  // 5. Beneficiary Name
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'beneficiaryName', ['shipper', 'exporter', 'seller'],
      ALL_DOC_TYPES, normalizeGeneral, 'MAJOR',
    ),
  )

  // 6. Applicant Name
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'applicantName', ['consignee', 'buyer', 'importer', 'notifyParty'],
      ['COMMERCIAL_INVOICE', 'BILL_OF_LADING', 'PACKING_LIST'],
      normalizeGeneral, 'MAJOR',
    ),
  )

  // 7. Marks & Numbers
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'marksAndNumbers', ['marks', 'shippingMarks'],
      ['COMMERCIAL_INVOICE', 'BILL_OF_LADING', 'PACKING_LIST'],
      normalizeGeneral, 'MAJOR',
    ),
  )

  // 8. Vessel Name
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'vesselName', ['vessel', 'shipName', 'oceanVessel'],
      ['BILL_OF_LADING', 'INSURANCE_CERTIFICATE'],
      normalizeGeneral, 'MINOR',
    ),
  )

  // 9. LC Number (if mentioned in supporting docs)
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'lcNumber', ['lcRef', 'creditNumber', 'documentaryCreditNumber'],
      ALL_DOC_TYPES, normalizeGeneral, 'MAJOR',
    ),
  )

  // 10. Quantity (with unit normalization: kg↔mt, pcs↔pieces)
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'quantity', ['totalQuantity', 'qty'],
      ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING'],
      normalizeQuantity, 'MAJOR',
    ),
  )

  // 11. Port of Loading
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'portOfLoading', ['loadingPort', 'placeOfReceipt'],
      ['BILL_OF_LADING', 'INSURANCE_CERTIFICATE', 'AIRWAY_BILL'],
      normalizeGeneral, 'MAJOR',
    ),
  )

  // 12. Port of Discharge
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'portOfDischarge', ['dischargePort', 'destinationPort', 'placeOfDelivery'],
      ['BILL_OF_LADING', 'INSURANCE_CERTIFICATE', 'AIRWAY_BILL'],
      normalizeGeneral, 'MAJOR',
    ),
  )

  // 13. Container Numbers
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'containerNumbers', ['containerNo', 'containers'],
      ['BILL_OF_LADING', 'PACKING_LIST', 'INSURANCE_CERTIFICATE'],
      normalizeGeneral, 'MAJOR',
    ),
  )

  // 14. Total Gross Weight (with unit normalization)
  findings.push(
    ...checkFieldConsistency(
      extractedDocs, 'totalGrossWeight', ['grossWeight', 'weight'],
      ['PACKING_LIST', 'BILL_OF_LADING'],
      normalizeQuantity, 'MAJOR',
    ),
  )

  return findings
}
