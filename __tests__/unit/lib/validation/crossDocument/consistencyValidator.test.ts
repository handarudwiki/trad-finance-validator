/**
 * Unit tests for cross-document consistency validator.
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { describe, it, expect } from 'vitest'
import { runCrossDocumentChecks } from '@/lib/validation/crossDocument/consistencyValidator'

describe('runCrossDocumentChecks', () => {
  describe('container numbers (Req 9.2)', () => {
    it('should return no findings when container numbers match across all documents', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { containerNumbers: ['CONT001', 'CONT002'] }],
        ['PACKING_LIST', { containerNumbers: ['CONT001', 'CONT002'] }],
        ['INSURANCE_CERTIFICATE', { containerNumbers: ['CONT001', 'CONT002'] }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const containerFindings = findings.filter((f) => f.field === 'containerNumbers')
      expect(containerFindings).toHaveLength(0)
    })

    it('should return MAJOR finding when container numbers mismatch between B/L and Packing List', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { containerNumbers: ['CONT001'] }],
        ['PACKING_LIST', { containerNumbers: ['CONT999'] }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const containerFindings = findings.filter((f) => f.field === 'containerNumbers')
      expect(containerFindings).toHaveLength(1)
      expect(containerFindings[0].checkType).toBe('CROSS_DOCUMENT')
      expect(containerFindings[0].severity).toBe('MAJOR')
      expect(containerFindings[0].regulatoryRef).toBe('UCP 600 Art. 14(d)')
      expect(containerFindings[0].description).toContain('Bill of Lading')
      expect(containerFindings[0].description).toContain('Packing List')
    })

    it('should detect mismatch with string container numbers', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { containerNumbers: 'CONT001' }],
        ['PACKING_LIST', { containerNumbers: 'CONT002' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const containerFindings = findings.filter((f) => f.field === 'containerNumbers')
      expect(containerFindings).toHaveLength(1)
      expect(containerFindings[0].severity).toBe('MAJOR')
    })
  })

  describe('total gross weight (Req 9.3)', () => {
    it('should return no findings when gross weight matches across documents', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['PACKING_LIST', { totalGrossWeight: '5000 KG' }],
        ['BILL_OF_LADING', { totalGrossWeight: '5000 KG' }],
        ['INSURANCE_CERTIFICATE', { totalGrossWeight: '5000 KG' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const weightFindings = findings.filter((f) => f.field === 'totalGrossWeight')
      expect(weightFindings).toHaveLength(0)
    })

    it('should return MAJOR finding when gross weight mismatches', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['PACKING_LIST', { totalGrossWeight: '5000 KG' }],
        ['BILL_OF_LADING', { totalGrossWeight: '4500 KG' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const weightFindings = findings.filter((f) => f.field === 'totalGrossWeight')
      expect(weightFindings).toHaveLength(1)
      expect(weightFindings[0].checkType).toBe('CROSS_DOCUMENT')
      expect(weightFindings[0].severity).toBe('MAJOR')
      expect(weightFindings[0].description).toContain('Packing List')
      expect(weightFindings[0].description).toContain('Bill of Lading')
    })
  })

  describe('total quantity (Req 9.4)', () => {
    it('should return no findings when quantity matches', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['COMMERCIAL_INVOICE', { totalQuantity: 100 }],
        ['PACKING_LIST', { totalQuantity: 100 }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const qtyFindings = findings.filter((f) => f.field === 'totalQuantity')
      expect(qtyFindings).toHaveLength(0)
    })

    it('should return MAJOR finding when quantity mismatches', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['COMMERCIAL_INVOICE', { totalQuantity: 100 }],
        ['PACKING_LIST', { totalQuantity: 90 }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const qtyFindings = findings.filter((f) => f.field === 'totalQuantity')
      expect(qtyFindings).toHaveLength(1)
      expect(qtyFindings[0].checkType).toBe('CROSS_DOCUMENT')
      expect(qtyFindings[0].severity).toBe('MAJOR')
      expect(qtyFindings[0].regulatoryRef).toBe('UCP 600 Art. 14(d)')
    })

    it('should handle string vs number comparison', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['COMMERCIAL_INVOICE', { totalQuantity: '100' }],
        ['PACKING_LIST', { totalQuantity: 100 }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const qtyFindings = findings.filter((f) => f.field === 'totalQuantity')
      // Both should normalize to "100"
      expect(qtyFindings).toHaveLength(0)
    })
  })

  describe('port of loading (Req 9.5)', () => {
    it('should return no findings when ports match', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { portOfLoading: 'JAKARTA' }],
        ['INSURANCE_CERTIFICATE', { portOfLoading: 'JAKARTA' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const portFindings = findings.filter((f) => f.field === 'portOfLoading')
      expect(portFindings).toHaveLength(0)
    })

    it('should return MAJOR finding when port of loading mismatches', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { portOfLoading: 'JAKARTA' }],
        ['INSURANCE_CERTIFICATE', { portOfLoading: 'SURABAYA' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const portFindings = findings.filter((f) => f.field === 'portOfLoading')
      expect(portFindings).toHaveLength(1)
      expect(portFindings[0].checkType).toBe('CROSS_DOCUMENT')
      expect(portFindings[0].severity).toBe('MAJOR')
      expect(portFindings[0].description).toContain('Bill of Lading')
      expect(portFindings[0].description).toContain('Insurance Certificate')
    })

    it('should be case-insensitive', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { portOfLoading: 'Jakarta' }],
        ['INSURANCE_CERTIFICATE', { portOfLoading: 'JAKARTA' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const portFindings = findings.filter((f) => f.field === 'portOfLoading')
      expect(portFindings).toHaveLength(0)
    })
  })

  describe('port of discharge (Req 9.5)', () => {
    it('should return no findings when ports match', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { portOfDischarge: 'SINGAPORE' }],
        ['INSURANCE_CERTIFICATE', { portOfDischarge: 'SINGAPORE' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const portFindings = findings.filter((f) => f.field === 'portOfDischarge')
      expect(portFindings).toHaveLength(0)
    })

    it('should return MAJOR finding when port of discharge mismatches', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { portOfDischarge: 'SINGAPORE' }],
        ['INSURANCE_CERTIFICATE', { portOfDischarge: 'HONG KONG' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const portFindings = findings.filter((f) => f.field === 'portOfDischarge')
      expect(portFindings).toHaveLength(1)
      expect(portFindings[0].checkType).toBe('CROSS_DOCUMENT')
      expect(portFindings[0].severity).toBe('MAJOR')
    })
  })

  describe('graceful skip when documents are missing (Req 9.1)', () => {
    it('should return no findings when map is empty', () => {
      const docs = new Map<string, Record<string, unknown>>()
      const findings = runCrossDocumentChecks(docs)
      expect(findings).toHaveLength(0)
    })

    it('should return no findings when only one document type is present', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { containerNumbers: ['CONT001'], portOfLoading: 'JAKARTA' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      expect(findings).toHaveLength(0)
    })

    it('should skip container check when field is missing from documents', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { portOfLoading: 'JAKARTA' }],
        ['PACKING_LIST', { totalQuantity: 100 }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const containerFindings = findings.filter((f) => f.field === 'containerNumbers')
      expect(containerFindings).toHaveLength(0)
    })

    it('should skip check when field value is null', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { containerNumbers: null }],
        ['PACKING_LIST', { containerNumbers: ['CONT001'] }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const containerFindings = findings.filter((f) => f.field === 'containerNumbers')
      expect(containerFindings).toHaveLength(0)
    })

    it('should skip check when field value is empty string', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['BILL_OF_LADING', { portOfLoading: '' }],
        ['INSURANCE_CERTIFICATE', { portOfLoading: 'JAKARTA' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      const portFindings = findings.filter((f) => f.field === 'portOfLoading')
      expect(portFindings).toHaveLength(0)
    })
  })

  describe('Finding structure (Req 9.6)', () => {
    it('should have correct checkType for all findings', () => {
      const docs = new Map<string, Record<string, unknown>>([
        ['COMMERCIAL_INVOICE', { totalQuantity: 100 }],
        ['PACKING_LIST', { totalQuantity: 200 }],
        ['BILL_OF_LADING', { portOfLoading: 'JAKARTA' }],
        ['INSURANCE_CERTIFICATE', { portOfLoading: 'SURABAYA' }],
      ])

      const findings = runCrossDocumentChecks(docs)
      for (const finding of findings) {
        expect(finding.checkType).toBe('CROSS_DOCUMENT')
        expect(finding.severity).toBe('MAJOR')
        expect(finding.regulatoryRef).toBe('UCP 600 Art. 14(d)')
        expect(finding.ragChunkIds).toEqual([])
        expect(finding.description).toBeTruthy()
        expect(finding.field).toBeTruthy()
      }
    })
  })
})
