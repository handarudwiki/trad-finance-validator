/**
 * Property-based test for cross-document consistency validator.
 * **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6**
 *
 * Property 16: Cross-document finding structure
 * For any set of supporting documents with mismatched values for a shared field,
 * `runCrossDocumentChecks` SHALL produce a Finding with `checkType: "CROSS_DOCUMENT"`
 * referencing the specific documents involved.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { runCrossDocumentChecks } from '@/lib/validation/crossDocument/consistencyValidator'

/** Generate a non-empty trimmed string */
const nonEmptyString = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)

/** Generate two distinct non-empty strings */
const twoDistinctStrings = fc
  .tuple(nonEmptyString, nonEmptyString)
  .filter(([a, b]) => a.trim().toLowerCase() !== b.trim().toLowerCase())

describe('Property 16: Cross-document finding structure', () => {
  it('container number mismatch always produces CROSS_DOCUMENT MAJOR Finding referencing the documents', () => {
    fc.assert(
      fc.property(twoDistinctStrings, ([containerA, containerB]) => {
        const docs = new Map<string, Record<string, unknown>>([
          ['BILL_OF_LADING', { containerNumbers: containerA }],
          ['PACKING_LIST', { containerNumbers: containerB }],
        ])

        const findings = runCrossDocumentChecks(docs)
        const relevant = findings.filter((f) => f.field === 'containerNumbers')

        expect(relevant.length).toBeGreaterThanOrEqual(1)
        for (const finding of relevant) {
          expect(finding.checkType).toBe('CROSS_DOCUMENT')
          expect(finding.severity).toBe('MAJOR')
          expect(finding.regulatoryRef).toBe('UCP 600 Art. 14(d)')
          expect(finding.ragChunkIds).toEqual([])
          expect(finding.description).toContain('Bill of Lading')
          expect(finding.description).toContain('Packing List')
        }
      }),
      { numRuns: 100 },
    )
  })

  it('totalGrossWeight mismatch always produces CROSS_DOCUMENT MAJOR Finding', () => {
    fc.assert(
      fc.property(twoDistinctStrings, ([weightA, weightB]) => {
        const docs = new Map<string, Record<string, unknown>>([
          ['PACKING_LIST', { totalGrossWeight: weightA }],
          ['BILL_OF_LADING', { totalGrossWeight: weightB }],
        ])

        const findings = runCrossDocumentChecks(docs)
        const relevant = findings.filter((f) => f.field === 'totalGrossWeight')

        expect(relevant.length).toBeGreaterThanOrEqual(1)
        for (const finding of relevant) {
          expect(finding.checkType).toBe('CROSS_DOCUMENT')
          expect(finding.severity).toBe('MAJOR')
          expect(finding.regulatoryRef).toBe('UCP 600 Art. 14(d)')
          expect(finding.description).toContain('Packing List')
          expect(finding.description).toContain('Bill of Lading')
        }
      }),
      { numRuns: 100 },
    )
  })

  it('totalQuantity mismatch always produces CROSS_DOCUMENT MAJOR Finding', () => {
    fc.assert(
      fc.property(twoDistinctStrings, ([qtyA, qtyB]) => {
        const docs = new Map<string, Record<string, unknown>>([
          ['COMMERCIAL_INVOICE', { totalQuantity: qtyA }],
          ['PACKING_LIST', { totalQuantity: qtyB }],
        ])

        const findings = runCrossDocumentChecks(docs)
        const relevant = findings.filter((f) => f.field === 'totalQuantity')

        expect(relevant.length).toBeGreaterThanOrEqual(1)
        for (const finding of relevant) {
          expect(finding.checkType).toBe('CROSS_DOCUMENT')
          expect(finding.severity).toBe('MAJOR')
          expect(finding.regulatoryRef).toBe('UCP 600 Art. 14(d)')
          expect(finding.description).toContain('Commercial Invoice')
          expect(finding.description).toContain('Packing List')
        }
      }),
      { numRuns: 100 },
    )
  })

  it('port of loading mismatch always produces CROSS_DOCUMENT MAJOR Finding', () => {
    fc.assert(
      fc.property(twoDistinctStrings, ([portA, portB]) => {
        const docs = new Map<string, Record<string, unknown>>([
          ['BILL_OF_LADING', { portOfLoading: portA }],
          ['INSURANCE_CERTIFICATE', { portOfLoading: portB }],
        ])

        const findings = runCrossDocumentChecks(docs)
        const relevant = findings.filter((f) => f.field === 'portOfLoading')

        expect(relevant.length).toBeGreaterThanOrEqual(1)
        for (const finding of relevant) {
          expect(finding.checkType).toBe('CROSS_DOCUMENT')
          expect(finding.severity).toBe('MAJOR')
          expect(finding.regulatoryRef).toBe('UCP 600 Art. 14(d)')
          expect(finding.description).toContain('Bill of Lading')
          expect(finding.description).toContain('Insurance Certificate')
        }
      }),
      { numRuns: 100 },
    )
  })

  it('port of discharge mismatch always produces CROSS_DOCUMENT MAJOR Finding', () => {
    fc.assert(
      fc.property(twoDistinctStrings, ([portA, portB]) => {
        const docs = new Map<string, Record<string, unknown>>([
          ['BILL_OF_LADING', { portOfDischarge: portA }],
          ['INSURANCE_CERTIFICATE', { portOfDischarge: portB }],
        ])

        const findings = runCrossDocumentChecks(docs)
        const relevant = findings.filter((f) => f.field === 'portOfDischarge')

        expect(relevant.length).toBeGreaterThanOrEqual(1)
        for (const finding of relevant) {
          expect(finding.checkType).toBe('CROSS_DOCUMENT')
          expect(finding.severity).toBe('MAJOR')
          expect(finding.regulatoryRef).toBe('UCP 600 Art. 14(d)')
          expect(finding.description).toContain('Bill of Lading')
          expect(finding.description).toContain('Insurance Certificate')
        }
      }),
      { numRuns: 100 },
    )
  })

  it('matching values across documents never produce findings for that field', () => {
    fc.assert(
      fc.property(nonEmptyString, (value) => {
        const docs = new Map<string, Record<string, unknown>>([
          ['BILL_OF_LADING', { containerNumbers: value, portOfLoading: value, portOfDischarge: value, totalGrossWeight: value }],
          ['PACKING_LIST', { containerNumbers: value, totalGrossWeight: value, totalQuantity: value }],
          ['INSURANCE_CERTIFICATE', { containerNumbers: value, portOfLoading: value, portOfDischarge: value, totalGrossWeight: value }],
          ['COMMERCIAL_INVOICE', { totalQuantity: value }],
        ])

        const findings = runCrossDocumentChecks(docs)
        expect(findings).toHaveLength(0)
      }),
      { numRuns: 100 },
    )
  })

  it('missing documents never produce findings for checks involving them', () => {
    fc.assert(
      fc.property(nonEmptyString, (value) => {
        // Only have B/L — no other document to compare against for ports
        const docs = new Map<string, Record<string, unknown>>([
          ['BILL_OF_LADING', { portOfLoading: value, portOfDischarge: value }],
        ])

        const findings = runCrossDocumentChecks(docs)
        const portFindings = findings.filter(
          (f) => f.field === 'portOfLoading' || f.field === 'portOfDischarge',
        )
        expect(portFindings).toHaveLength(0)
      }),
      { numRuns: 50 },
    )
  })
})
