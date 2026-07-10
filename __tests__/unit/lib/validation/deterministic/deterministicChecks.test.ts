/**
 * Unit tests for deterministic validation checks.
 * Satisfies: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */

import { describe, it, expect } from 'vitest'
import { checkAmount } from '@/lib/validation/deterministic/amountChecks'
import { checkCurrency } from '@/lib/validation/deterministic/currencyChecks'
import {
  checkDocumentDate,
  checkOnBoardDate,
  checkPresentationPeriod,
} from '@/lib/validation/deterministic/dateChecks'
import { checkQuantity } from '@/lib/validation/deterministic/quantityChecks'
import type { ExtractedLCFields } from '@/schema/extraction'

// Helper to create minimal LC fields for testing
function makeLCFields(overrides: Partial<ExtractedLCFields> = {}): ExtractedLCFields {
  return {
    lcNumber: 'LC-2024-001',
    issueDate: '2024-01-01',
    expiryDate: '2024-12-31',
    expiryPlace: 'Jakarta',
    issuingBank: { name: 'Bank A' },
    applicant: { name: 'Applicant Co', address: '123 Main St' },
    beneficiary: { name: 'Beneficiary Co', address: '456 Trade Ave' },
    currency: 'USD',
    amount: 100000,
    tolerancePct: 5,
    paymentTenor: 'At sight',
    availableWith: 'Bank A',
    availableBy: 'Negotiation',
    goodsDescription: 'Electronics',
    incoterms: 'FOB',
    portOfLoading: 'Jakarta',
    portOfDischarge: 'Singapore',
    latestShipmentDate: '2024-11-30',
    partialShipment: 'ALLOWED',
    transshipment: 'ALLOWED',
    presentationPeriodDays: 21,
    requiredDocuments: [{ documentType: 'COMMERCIAL_INVOICE', originals: 3, copies: 0 }],
    ...overrides,
  }
}

describe('amountChecks', () => {
  it('returns empty array when invoice amount is within tolerance', () => {
    const invoiceData = { amount: 105000 } // exactly at 5% tolerance
    const lcFields = makeLCFields({ amount: 100000, tolerancePct: 5 })
    const findings = checkAmount(invoiceData, lcFields)
    expect(findings).toEqual([])
  })

  it('returns FATAL finding when invoice amount exceeds tolerance', () => {
    const invoiceData = { amount: 106000 }
    const lcFields = makeLCFields({ amount: 100000, tolerancePct: 5 })
    const findings = checkAmount(invoiceData, lcFields)
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('FATAL')
    expect(findings[0].checkType).toBe('DETERMINISTIC')
    expect(findings[0].field).toBe('amount')
    expect(findings[0].regulatoryRef).toBe('UCP 600 Art. 14(b)')
  })

  it('uses 0% tolerance when tolerancePct is null', () => {
    const invoiceData = { amount: 100001 }
    const lcFields = makeLCFields({ amount: 100000, tolerancePct: null })
    const findings = checkAmount(invoiceData, lcFields)
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('FATAL')
  })

  it('returns empty array when invoice amount is null', () => {
    const invoiceData = { amount: null }
    const lcFields = makeLCFields()
    const findings = checkAmount(invoiceData, lcFields)
    expect(findings).toEqual([])
  })

  it('returns empty array when invoice amount is not a number', () => {
    const invoiceData = { amount: 'invalid' }
    const lcFields = makeLCFields()
    const findings = checkAmount(invoiceData, lcFields)
    expect(findings).toEqual([])
  })
})

describe('currencyChecks', () => {
  it('returns empty array when currencies match', () => {
    const invoiceData = { currency: 'USD' }
    const lcFields = makeLCFields({ currency: 'USD' })
    const findings = checkCurrency(invoiceData, lcFields)
    expect(findings).toEqual([])
  })

  it('returns FATAL finding when currencies differ', () => {
    const invoiceData = { currency: 'EUR' }
    const lcFields = makeLCFields({ currency: 'USD' })
    const findings = checkCurrency(invoiceData, lcFields)
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('FATAL')
    expect(findings[0].checkType).toBe('DETERMINISTIC')
    expect(findings[0].field).toBe('currency')
    expect(findings[0].regulatoryRef).toBe('UCP 600 Art. 14(b)')
  })

  it('returns empty array when invoice currency is null', () => {
    const invoiceData = { currency: null }
    const lcFields = makeLCFields()
    const findings = checkCurrency(invoiceData, lcFields)
    expect(findings).toEqual([])
  })

  it('returns empty array when invoice currency is not a string', () => {
    const invoiceData = { currency: 123 }
    const lcFields = makeLCFields()
    const findings = checkCurrency(invoiceData, lcFields)
    expect(findings).toEqual([])
  })
})

describe('dateChecks', () => {
  describe('checkDocumentDate', () => {
    it('returns empty array when doc date is before expiry', () => {
      const docData = { date: '2024-06-15' }
      const lcFields = makeLCFields({ expiryDate: '2024-12-31' })
      const findings = checkDocumentDate(docData, lcFields)
      expect(findings).toEqual([])
    })

    it('returns empty array when doc date equals expiry', () => {
      const docData = { date: '2024-12-31' }
      const lcFields = makeLCFields({ expiryDate: '2024-12-31' })
      const findings = checkDocumentDate(docData, lcFields)
      expect(findings).toEqual([])
    })

    it('returns FATAL finding when doc date exceeds expiry', () => {
      const docData = { date: '2025-01-01' }
      const lcFields = makeLCFields({ expiryDate: '2024-12-31' })
      const findings = checkDocumentDate(docData, lcFields)
      expect(findings).toHaveLength(1)
      expect(findings[0].severity).toBe('FATAL')
      expect(findings[0].checkType).toBe('DETERMINISTIC')
      expect(findings[0].field).toBe('date')
      expect(findings[0].regulatoryRef).toBe('UCP 600 Art. 14(c)')
    })

    it('returns empty array when date is null', () => {
      const docData = { date: null }
      const lcFields = makeLCFields()
      const findings = checkDocumentDate(docData, lcFields)
      expect(findings).toEqual([])
    })
  })

  describe('checkOnBoardDate', () => {
    it('returns empty array when on-board date is before latest shipment', () => {
      const blData = { onBoardDate: '2024-10-15' }
      const lcFields = makeLCFields({ latestShipmentDate: '2024-11-30' })
      const findings = checkOnBoardDate(blData, lcFields)
      expect(findings).toEqual([])
    })

    it('returns empty array when on-board date equals latest shipment', () => {
      const blData = { onBoardDate: '2024-11-30' }
      const lcFields = makeLCFields({ latestShipmentDate: '2024-11-30' })
      const findings = checkOnBoardDate(blData, lcFields)
      expect(findings).toEqual([])
    })

    it('returns FATAL finding when on-board date exceeds latest shipment', () => {
      const blData = { onBoardDate: '2024-12-01' }
      const lcFields = makeLCFields({ latestShipmentDate: '2024-11-30' })
      const findings = checkOnBoardDate(blData, lcFields)
      expect(findings).toHaveLength(1)
      expect(findings[0].severity).toBe('FATAL')
      expect(findings[0].checkType).toBe('DETERMINISTIC')
      expect(findings[0].field).toBe('onBoardDate')
      expect(findings[0].regulatoryRef).toBe('UCP 600 Art. 43(a)')
    })

    it('returns empty array when onBoardDate is null', () => {
      const blData = { onBoardDate: null }
      const lcFields = makeLCFields()
      const findings = checkOnBoardDate(blData, lcFields)
      expect(findings).toEqual([])
    })
  })

  describe('checkPresentationPeriod', () => {
    it('returns empty array when presentation deadline is before expiry', () => {
      const blData = { date: '2024-11-01' }
      const lcFields = makeLCFields({ expiryDate: '2024-12-31', presentationPeriodDays: 21 })
      // 2024-11-01 + 21 days = 2024-11-22, which is before 2024-12-31
      const findings = checkPresentationPeriod(blData, lcFields)
      expect(findings).toEqual([])
    })

    it('returns FATAL finding when presentation deadline exceeds expiry', () => {
      const blData = { date: '2024-12-20' }
      const lcFields = makeLCFields({ expiryDate: '2024-12-31', presentationPeriodDays: 21 })
      // 2024-12-20 + 21 days = 2025-01-10, which exceeds 2024-12-31
      const findings = checkPresentationPeriod(blData, lcFields)
      expect(findings).toHaveLength(1)
      expect(findings[0].severity).toBe('FATAL')
      expect(findings[0].checkType).toBe('DETERMINISTIC')
      expect(findings[0].field).toBe('presentationPeriod')
      expect(findings[0].regulatoryRef).toBe('UCP 600 Art. 14(c)')
    })

    it('returns empty array when presentationPeriodDays is null', () => {
      const blData = { date: '2024-12-20' }
      const lcFields = makeLCFields({ presentationPeriodDays: null })
      const findings = checkPresentationPeriod(blData, lcFields)
      expect(findings).toEqual([])
    })

    it('returns empty array when bl date is null', () => {
      const blData = { date: null }
      const lcFields = makeLCFields({ presentationPeriodDays: 21 })
      const findings = checkPresentationPeriod(blData, lcFields)
      expect(findings).toEqual([])
    })
  })
})

describe('quantityChecks', () => {
  it('returns empty array when quantities match', () => {
    const invoiceData = { quantity: '1000 units' }
    const packingListData = { quantity: '1000 units' }
    const findings = checkQuantity(invoiceData, packingListData)
    expect(findings).toEqual([])
  })

  it('returns MAJOR finding when quantities differ', () => {
    const invoiceData = { quantity: '1000 units' }
    const packingListData = { quantity: '900 units' }
    const findings = checkQuantity(invoiceData, packingListData)
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('MAJOR')
    expect(findings[0].checkType).toBe('DETERMINISTIC')
    expect(findings[0].field).toBe('quantity')
    expect(findings[0].regulatoryRef).toBe('UCP 600 Art. 14(d)')
  })

  it('returns empty array when invoice quantity is null', () => {
    const invoiceData = { quantity: null }
    const packingListData = { quantity: '1000 units' }
    const findings = checkQuantity(invoiceData, packingListData)
    expect(findings).toEqual([])
  })

  it('returns empty array when packing list quantity is null', () => {
    const invoiceData = { quantity: '1000 units' }
    const packingListData = { quantity: null }
    const findings = checkQuantity(invoiceData, packingListData)
    expect(findings).toEqual([])
  })

  it('handles numeric quantities by normalizing to strings', () => {
    const invoiceData = { quantity: 500 }
    const packingListData = { quantity: '500' }
    const findings = checkQuantity(invoiceData, packingListData)
    expect(findings).toEqual([])
  })
})
