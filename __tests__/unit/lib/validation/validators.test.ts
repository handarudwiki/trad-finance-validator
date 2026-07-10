/**
 * Unit tests for document-type validators.
 * Tests the validator factory and each validator's integration of checks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getValidator } from '@/lib/validation/validators'
import { InvoiceValidator } from '@/lib/validation/validators/invoiceValidator'
import { PackingListValidator } from '@/lib/validation/validators/packingListValidator'
import { BillOfLadingValidator } from '@/lib/validation/validators/billOfLadingValidator'
import { AirwayBillValidator } from '@/lib/validation/validators/airwayBillValidator'
import { CertificateOfOriginValidator } from '@/lib/validation/validators/certificateOfOriginValidator'
import { InsuranceCertificateValidator } from '@/lib/validation/validators/insuranceCertificateValidator'
import { GenericCertificateValidator } from '@/lib/validation/validators/genericCertificateValidator'
import type { ExtractedLCFields } from '@/schema/extraction'

// Mock interpretive checks since they require Gemini + Qdrant
vi.mock('@/lib/validation/interpretive/goodsDescriptionCheck', () => ({
  goodsDescriptionCheck: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/validation/interpretive/mandatoryWordingCheck', () => ({
  mandatoryWordingCheck: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/validation/interpretive/insuranceCoverageCheck', () => ({
  insuranceCoverageCheck: vi.fn().mockResolvedValue([]),
}))

const baseLCFields: ExtractedLCFields = {
  lcNumber: 'LC-2024-001',
  issueDate: '2024-01-01',
  expiryDate: '2024-12-31',
  expiryPlace: 'Jakarta',
  issuingBank: { name: 'Bank A', address: '123 Street', swiftCode: 'BANKAAXX' },
  applicant: { name: 'Importer Corp', address: '456 Ave' },
  beneficiary: { name: 'Exporter Corp', address: '789 Blvd' },
  currency: 'USD',
  amount: 100000,
  tolerancePct: 5,
  paymentTenor: 'Sight',
  availableWith: 'Bank A',
  availableBy: 'Negotiation',
  goodsDescription: 'Electronic components',
  incoterms: 'CIF Jakarta',
  portOfLoading: 'Shanghai',
  portOfDischarge: 'Jakarta',
  latestShipmentDate: '2024-11-30',
  partialShipment: 'ALLOWED',
  transshipment: 'ALLOWED',
  presentationPeriodDays: 21,
  requiredDocuments: [
    { documentType: 'COMMERCIAL_INVOICE', originals: 3, copies: 3, requirements: null },
    { documentType: 'PACKING_LIST', originals: 3, copies: 3, requirements: null },
    { documentType: 'BILL_OF_LADING', originals: 3, copies: 0, requirements: null },
    { documentType: 'CERTIFICATE_OF_ORIGIN', originals: 1, copies: 2, requirements: 'Must state country of origin' },
  ],
}

describe('getValidator factory', () => {
  it('returns InvoiceValidator for COMMERCIAL_INVOICE', () => {
    const validator = getValidator('COMMERCIAL_INVOICE')
    expect(validator).toBeInstanceOf(InvoiceValidator)
  })

  it('returns PackingListValidator for PACKING_LIST', () => {
    const validator = getValidator('PACKING_LIST')
    expect(validator).toBeInstanceOf(PackingListValidator)
  })

  it('returns BillOfLadingValidator for BILL_OF_LADING', () => {
    const validator = getValidator('BILL_OF_LADING')
    expect(validator).toBeInstanceOf(BillOfLadingValidator)
  })

  it('returns AirwayBillValidator for AIRWAY_BILL', () => {
    const validator = getValidator('AIRWAY_BILL')
    expect(validator).toBeInstanceOf(AirwayBillValidator)
  })

  it('returns CertificateOfOriginValidator for CERTIFICATE_OF_ORIGIN', () => {
    const validator = getValidator('CERTIFICATE_OF_ORIGIN')
    expect(validator).toBeInstanceOf(CertificateOfOriginValidator)
  })

  it('returns InsuranceCertificateValidator for INSURANCE_CERTIFICATE', () => {
    const validator = getValidator('INSURANCE_CERTIFICATE')
    expect(validator).toBeInstanceOf(InsuranceCertificateValidator)
  })

  it('returns GenericCertificateValidator for INSPECTION_CERTIFICATE', () => {
    const validator = getValidator('INSPECTION_CERTIFICATE')
    expect(validator).toBeInstanceOf(GenericCertificateValidator)
  })

  it('returns GenericCertificateValidator for BENEFICIARY_CERTIFICATE', () => {
    const validator = getValidator('BENEFICIARY_CERTIFICATE')
    expect(validator).toBeInstanceOf(GenericCertificateValidator)
  })

  it('returns GenericCertificateValidator for CERTIFICATE_OF_ANALYSIS', () => {
    const validator = getValidator('CERTIFICATE_OF_ANALYSIS')
    expect(validator).toBeInstanceOf(GenericCertificateValidator)
  })

  it('returns GenericCertificateValidator for PHYTOSANITARY_CERTIFICATE', () => {
    const validator = getValidator('PHYTOSANITARY_CERTIFICATE')
    expect(validator).toBeInstanceOf(GenericCertificateValidator)
  })

  it('returns null for unsupported document types', () => {
    expect(getValidator('OTHER')).toBeNull()
    expect(getValidator('BILL_OF_EXCHANGE')).toBeNull()
    expect(getValidator('SURAT_JALAN')).toBeNull()
  })
})

describe('InvoiceValidator', () => {
  const validator = new InvoiceValidator()

  it('returns no findings when all checks pass', async () => {
    const docData = {
      amount: 100000,
      currency: 'USD',
      date: '2024-06-15',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    expect(findings).toEqual([])
  })

  it('returns FATAL finding when amount exceeds LC amount + tolerance', async () => {
    const docData = {
      amount: 110000, // Exceeds 100000 * 1.05 = 105000
      currency: 'USD',
      date: '2024-06-15',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const amountFinding = findings.find(f => f.field === 'amount')
    expect(amountFinding).toBeDefined()
    expect(amountFinding!.severity).toBe('FATAL')
    expect(amountFinding!.checkType).toBe('DETERMINISTIC')
  })

  it('returns FATAL finding when currency does not match', async () => {
    const docData = {
      amount: 50000,
      currency: 'EUR',
      date: '2024-06-15',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const currencyFinding = findings.find(f => f.field === 'currency')
    expect(currencyFinding).toBeDefined()
    expect(currencyFinding!.severity).toBe('FATAL')
    expect(currencyFinding!.checkType).toBe('DETERMINISTIC')
  })

  it('returns FATAL finding when document date exceeds expiry', async () => {
    const docData = {
      amount: 50000,
      currency: 'USD',
      date: '2025-01-15', // After expiry 2024-12-31
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const dateFinding = findings.find(f => f.field === 'date')
    expect(dateFinding).toBeDefined()
    expect(dateFinding!.severity).toBe('FATAL')
    expect(dateFinding!.checkType).toBe('DETERMINISTIC')
  })
})

describe('BillOfLadingValidator', () => {
  const validator = new BillOfLadingValidator()

  it('returns no findings when all dates are within limits', async () => {
    const docData = {
      onBoardDate: '2024-10-15',
      date: '2024-10-15',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    expect(findings).toEqual([])
  })

  it('returns FATAL finding when on-board date exceeds latest shipment date', async () => {
    const docData = {
      onBoardDate: '2024-12-15', // After latest shipment 2024-11-30
      date: '2024-10-15',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const finding = findings.find(f => f.field === 'onBoardDate')
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('FATAL')
    expect(finding!.checkType).toBe('DETERMINISTIC')
    expect(finding!.regulatoryRef).toBe('UCP 600 Art. 43(a)')
  })

  it('returns FATAL finding when presentation period exceeds expiry', async () => {
    const docData = {
      onBoardDate: '2024-11-01',
      date: '2024-12-20', // 2024-12-20 + 21 days = 2025-01-10 > expiry 2024-12-31
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const finding = findings.find(f => f.field === 'presentationPeriod')
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('FATAL')
    expect(finding!.checkType).toBe('DETERMINISTIC')
  })
})

describe('AirwayBillValidator', () => {
  const validator = new AirwayBillValidator()

  it('returns no findings when all dates are within limits', async () => {
    const docData = {
      onBoardDate: '2024-10-15',
      date: '2024-10-15',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    expect(findings).toEqual([])
  })

  it('returns FATAL finding when on-board date exceeds latest shipment date', async () => {
    const docData = {
      onBoardDate: '2024-12-01', // After latest shipment 2024-11-30
      date: '2024-10-15',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const finding = findings.find(f => f.field === 'onBoardDate')
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('FATAL')
  })
})

describe('PackingListValidator', () => {
  it('returns FATAL finding when document date exceeds expiry', async () => {
    const validator = new PackingListValidator()
    const docData = {
      date: '2025-01-15',
      quantity: '1000',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const finding = findings.find(f => f.field === 'date')
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('FATAL')
  })

  it('returns MAJOR finding when quantity differs from invoice', async () => {
    const validator = new PackingListValidator()
    validator.setInvoiceData({ quantity: '500' })
    const docData = {
      date: '2024-06-15',
      quantity: '1000',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const finding = findings.find(f => f.field === 'quantity')
    expect(finding).toBeDefined()
    expect(finding!.severity).toBe('MAJOR')
    expect(finding!.checkType).toBe('DETERMINISTIC')
  })

  it('returns no quantity finding when no invoice data is set', async () => {
    const validator = new PackingListValidator()
    const docData = {
      date: '2024-06-15',
      quantity: '1000',
    }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    const finding = findings.find(f => f.field === 'quantity')
    expect(finding).toBeUndefined()
  })
})

describe('CertificateOfOriginValidator', () => {
  it('calls mandatoryWordingCheck (mocked to return empty)', async () => {
    const validator = new CertificateOfOriginValidator()
    const docData = { content: 'Country of origin: China' }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    expect(findings).toEqual([])
  })
})

describe('InsuranceCertificateValidator', () => {
  it('calls insuranceCoverageCheck (mocked to return empty)', async () => {
    const validator = new InsuranceCertificateValidator()
    const docData = { insuredAmount: 110000, currency: 'USD' }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    expect(findings).toEqual([])
  })
})

describe('GenericCertificateValidator', () => {
  it('calls mandatoryWordingCheck for INSPECTION_CERTIFICATE', async () => {
    const validator = new GenericCertificateValidator('INSPECTION_CERTIFICATE')
    const docData = { content: 'Goods inspected and approved' }
    const findings = await validator.validate(baseLCFields, docData, 'LC')
    expect(findings).toEqual([])
  })

  it('accepts different document types', async () => {
    for (const docType of [
      'INSPECTION_CERTIFICATE',
      'BENEFICIARY_CERTIFICATE',
      'CERTIFICATE_OF_ANALYSIS',
      'PHYTOSANITARY_CERTIFICATE',
    ]) {
      const validator = new GenericCertificateValidator(docType)
      const findings = await validator.validate(baseLCFields, {}, 'SKBDN')
      expect(findings).toEqual([])
    }
  })
})
