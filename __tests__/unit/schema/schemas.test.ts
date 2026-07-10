/**
 * Unit tests for Zod schemas.
 * Validates: Requirements 1.2, 4.4, 4.5, 8.4, 8.10
 */

import { describe, it, expect } from 'vitest'
import { CreateTransactionSchema } from '@/schema/transaction'
import { ExtractedLCFieldsSchema } from '@/schema/extraction'
import { FindingSchema, FindingArraySchema } from '@/schema/finding'

describe('CreateTransactionSchema', () => {
  it('accepts LC type', () => {
    const result = CreateTransactionSchema.safeParse({ type: 'LC' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('LC')
    }
  })

  it('accepts SKBDN type', () => {
    const result = CreateTransactionSchema.safeParse({ type: 'SKBDN' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('SKBDN')
    }
  })

  it('rejects non-LC/SKBDN values with descriptive error', () => {
    const result = CreateTransactionSchema.safeParse({ type: 'INVALID' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const message = result.error.issues[0].message
      expect(message).toBe('Transaction type must be LC or SKBDN')
    }
  })

  it('rejects empty body', () => {
    const result = CreateTransactionSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects missing type field', () => {
    const result = CreateTransactionSchema.safeParse({ type: undefined })
    expect(result.success).toBe(false)
  })
})

describe('ExtractedLCFieldsSchema', () => {
  const validData = {
    lcNumber: 'LC-2024-001',
    issueDate: '2024-01-15',
    expiryDate: '2024-06-15',
    expiryPlace: 'Jakarta',
    issuingBank: {
      name: 'Bank Central Asia',
      address: 'Jakarta, Indonesia',
      swiftCode: 'CENAIDJA',
    },
    applicant: {
      name: 'PT Importir Indonesia',
      address: 'Jl. Sudirman No. 1, Jakarta',
    },
    beneficiary: {
      name: 'ABC Trading Co.',
      address: '123 Export St, Singapore',
    },
    currency: 'USD',
    amount: 50000,
    paymentTenor: 'At sight',
    availableWith: 'Bank Central Asia',
    availableBy: 'Negotiation',
    goodsDescription: 'Electronic components - capacitors 100uF',
    incoterms: 'CIF Jakarta',
    portOfLoading: 'Singapore',
    portOfDischarge: 'Tanjung Priok, Jakarta',
    latestShipmentDate: '2024-05-30',
    partialShipment: 'ALLOWED' as const,
    transshipment: 'NOT_ALLOWED' as const,
    requiredDocuments: [
      {
        documentType: 'COMMERCIAL_INVOICE',
        originals: 3,
        copies: 3,
        requirements: 'Signed by beneficiary',
      },
    ],
  }

  it('accepts valid complete data', () => {
    const result = ExtractedLCFieldsSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('accepts data with optional fields set to null', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      advisingBank: null,
      tolerancePct: null,
      quantity: null,
      presentationPeriodDays: null,
      additionalConditions: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts data with confidence map', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      confidence: { lcNumber: 0.95, issueDate: 0.88, amount: 1.0 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid ISO date format', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      issueDate: '15-01-2024', // wrong format
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const dateIssue = result.error.issues.find(
        (i) => i.path.includes('issueDate') || JSON.stringify(i.path).includes('issueDate')
      )
      expect(dateIssue).toBeDefined()
      expect(dateIssue!.message).toBe('Must be YYYY-MM-DD')
    }
  })

  it('rejects currency code not exactly 3 characters', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      currency: 'US', // too short
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const currIssue = result.error.issues.find(
        (i) => i.path.includes('currency') || JSON.stringify(i.path).includes('currency')
      )
      expect(currIssue).toBeDefined()
      expect(currIssue!.message).toBe('Must be ISO 4217 3-letter currency code')
    }
  })

  it('rejects non-positive amount', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      amount: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      amount: -100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty requiredDocuments array', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      requiredDocuments: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects confidence values outside 0-1 range', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      confidence: { lcNumber: 1.5 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid partialShipment enum value', () => {
    const result = ExtractedLCFieldsSchema.safeParse({
      ...validData,
      partialShipment: 'MAYBE',
    })
    expect(result.success).toBe(false)
  })
})

describe('FindingSchema', () => {
  const validFinding = {
    checkType: 'DETERMINISTIC' as const,
    severity: 'FATAL' as const,
    field: 'amount',
    expected: '50000',
    found: '60000',
    description: 'Invoice amount exceeds LC amount plus tolerance',
    suggestedCorrection: 'Reduce invoice amount to within tolerance',
    regulatoryRef: 'UCP 600 Art. 14(b)',
    ragChunkIds: [],
  }

  it('accepts a valid Finding', () => {
    const result = FindingSchema.safeParse(validFinding)
    expect(result.success).toBe(true)
  })

  it('accepts Finding with nullable fields set to null', () => {
    const result = FindingSchema.safeParse({
      ...validFinding,
      expected: null,
      found: null,
      suggestedCorrection: null,
    })
    expect(result.success).toBe(true)
  })

  it('defaults ragChunkIds to empty array when not provided', () => {
    const { ragChunkIds, ...withoutRagChunks } = validFinding
    const result = FindingSchema.safeParse(withoutRagChunks)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ragChunkIds).toEqual([])
    }
  })

  it('accepts ragChunkIds with string values', () => {
    const result = FindingSchema.safeParse({
      ...validFinding,
      ragChunkIds: ['chunk-1', 'chunk-2'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ragChunkIds).toEqual(['chunk-1', 'chunk-2'])
    }
  })
})

describe('FindingArraySchema', () => {
  it('parses a valid array of findings', () => {
    const validFindings = [
      {
        checkType: 'DETERMINISTIC',
        severity: 'FATAL',
        field: 'amount',
        description: 'Amount exceeds tolerance',
        regulatoryRef: 'UCP 600 Art. 14(b)',
      },
      {
        checkType: 'INTERPRETIVE',
        severity: 'MAJOR',
        field: 'beneficiaryName',
        description: 'Name variation detected',
        regulatoryRef: 'ISBP 745 A21',
        ragChunkIds: ['isbp-a21'],
      },
    ]
    const result = FindingArraySchema.safeParse(validFindings)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
      expect(result.data[0].checkType).toBe('DETERMINISTIC')
      expect(result.data[1].checkType).toBe('INTERPRETIVE')
    }
  })

  it('parses an empty array (no discrepancies)', () => {
    const result = FindingArraySchema.safeParse([])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(0)
    }
  })

  it('rejects invalid shape - missing required fields', () => {
    const invalidFindings = [
      {
        checkType: 'DETERMINISTIC',
        // missing severity, field, description, regulatoryRef
      },
    ]
    const result = FindingArraySchema.safeParse(invalidFindings)
    expect(result.success).toBe(false)
  })

  it('rejects invalid shape - wrong checkType value', () => {
    const invalidFindings = [
      {
        checkType: 'UNKNOWN_TYPE',
        severity: 'FATAL',
        field: 'amount',
        description: 'Test',
        regulatoryRef: 'Test ref',
      },
    ]
    const result = FindingArraySchema.safeParse(invalidFindings)
    expect(result.success).toBe(false)
  })

  it('rejects non-array input', () => {
    const result = FindingArraySchema.safeParse({ not: 'an array' })
    expect(result.success).toBe(false)
  })

  it('rejects array with non-object elements', () => {
    const result = FindingArraySchema.safeParse(['string', 123, true])
    expect(result.success).toBe(false)
  })
})
