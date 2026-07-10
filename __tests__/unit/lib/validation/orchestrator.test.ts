/**
 * Unit tests for the validation orchestrator.
 * Tests the runValidation pipeline using mocked dependencies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all external dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    supportingDocument: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    discrepancyReport: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/extraction/extractSupportingDocument', () => ({
  extractSupportingDocument: vi.fn(),
}))

vi.mock('@/lib/storage', () => ({
  readFile: vi.fn(),
}))

vi.mock('@/lib/validation/validators', () => ({
  getValidator: vi.fn(),
}))

vi.mock('@/lib/validation/crossDocument/consistencyValidator', () => ({
  runCrossDocumentChecks: vi.fn(),
}))

import { runValidation } from '@/lib/validation/orchestrator'
import { prisma } from '@/lib/prisma'
import { extractSupportingDocument } from '@/lib/extraction/extractSupportingDocument'
import { readFile } from '@/lib/storage'
import { getValidator } from '@/lib/validation/validators'
import { runCrossDocumentChecks } from '@/lib/validation/crossDocument/consistencyValidator'

const mockPrisma = prisma as unknown as {
  transaction: {
    update: ReturnType<typeof vi.fn>
    findUniqueOrThrow: ReturnType<typeof vi.fn>
  }
  supportingDocument: {
    update: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
  discrepancyReport: {
    create: ReturnType<typeof vi.fn>
  }
}

const mockExtractSupportingDocument = extractSupportingDocument as ReturnType<typeof vi.fn>
const mockReadFile = readFile as ReturnType<typeof vi.fn>
const mockGetValidator = getValidator as ReturnType<typeof vi.fn>
const mockRunCrossDocumentChecks = runCrossDocumentChecks as ReturnType<typeof vi.fn>

// Helper to build a valid LC fields object
function buildLCFields() {
  return {
    lcNumber: 'LC-001',
    issueDate: '2024-01-01',
    expiryDate: '2024-12-31',
    expiryPlace: 'Jakarta',
    issuingBank: { name: 'Bank A', address: 'Addr A' },
    applicant: { name: 'Applicant Corp', address: 'Addr B' },
    beneficiary: { name: 'Beneficiary Ltd', address: 'Addr C' },
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
    requiredDocuments: [{ documentType: 'COMMERCIAL_INVOICE', originals: 3, copies: 0 }],
  }
}

describe('runValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRunCrossDocumentChecks.mockReturnValue([])
  })

  it('sets status to VALIDATING at start', async () => {
    const transactionId = 'tx-001'

    mockPrisma.transaction.findUniqueOrThrow.mockResolvedValue({
      id: transactionId,
      type: 'LC',
      sourceDocument: { reviewedFields: buildLCFields() },
      supportingDocs: [],
    })
    mockPrisma.supportingDocument.findMany.mockResolvedValue([])
    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.discrepancyReport.create.mockResolvedValue({})

    await runValidation(transactionId)

    expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
      where: { id: transactionId },
      data: { status: 'VALIDATING' },
    })
  })

  it('sets status to COMPLETED on successful pipeline', async () => {
    const transactionId = 'tx-002'

    mockPrisma.transaction.findUniqueOrThrow.mockResolvedValue({
      id: transactionId,
      type: 'LC',
      sourceDocument: { reviewedFields: buildLCFields() },
      supportingDocs: [],
    })
    mockPrisma.supportingDocument.findMany.mockResolvedValue([])
    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.discrepancyReport.create.mockResolvedValue({})

    await runValidation(transactionId)

    // Last call should be COMPLETED
    const updateCalls = mockPrisma.transaction.update.mock.calls
    const lastCall = updateCalls[updateCalls.length - 1]
    expect(lastCall[0]).toEqual({
      where: { id: transactionId },
      data: { status: 'COMPLETED' },
    })
  })

  it('sets status to FAILED with errorDetails on unrecoverable error', async () => {
    const transactionId = 'tx-003'

    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.transaction.findUniqueOrThrow.mockRejectedValue(new Error('DB connection lost'))

    await runValidation(transactionId)

    const updateCalls = mockPrisma.transaction.update.mock.calls
    const lastCall = updateCalls[updateCalls.length - 1]
    expect(lastCall[0]).toEqual({
      where: { id: transactionId },
      data: { status: 'FAILED', errorDetails: 'Error: DB connection lost' },
    })
  })

  it('extracts unextracted supporting documents in parallel', async () => {
    const transactionId = 'tx-004'

    const supportingDocs = [
      { id: 'doc-1', documentType: 'COMMERCIAL_INVOICE', filePath: '/path/1', mimeType: 'application/pdf', extractedData: null },
      { id: 'doc-2', documentType: 'PACKING_LIST', filePath: '/path/2', mimeType: 'application/pdf', extractedData: null },
    ]

    mockPrisma.transaction.findUniqueOrThrow.mockResolvedValue({
      id: transactionId,
      type: 'LC',
      sourceDocument: { reviewedFields: buildLCFields() },
      supportingDocs,
    })

    mockReadFile.mockResolvedValue(Buffer.from('fake-pdf'))
    mockExtractSupportingDocument.mockResolvedValue({ amount: 90000, currency: 'USD' })
    mockPrisma.supportingDocument.update.mockResolvedValue({})
    mockPrisma.supportingDocument.findMany.mockResolvedValue(
      supportingDocs.map(d => ({ ...d, extractedData: { amount: 90000, currency: 'USD' } }))
    )
    mockGetValidator.mockReturnValue(null)
    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.discrepancyReport.create.mockResolvedValue({})

    await runValidation(transactionId)

    // Both docs should be extracted
    expect(mockExtractSupportingDocument).toHaveBeenCalledTimes(2)
  })

  it('records FATAL finding when extraction fails for a document', async () => {
    const transactionId = 'tx-005'

    const supportingDocs = [
      { id: 'doc-1', documentType: 'COMMERCIAL_INVOICE', filePath: '/path/1', mimeType: 'application/pdf', extractedData: null },
      { id: 'doc-2', documentType: 'PACKING_LIST', filePath: '/path/2', mimeType: 'application/pdf', extractedData: null },
    ]

    mockPrisma.transaction.findUniqueOrThrow.mockResolvedValue({
      id: transactionId,
      type: 'LC',
      sourceDocument: { reviewedFields: buildLCFields() },
      supportingDocs,
    })

    mockReadFile.mockResolvedValue(Buffer.from('fake-pdf'))
    // First succeeds, second fails
    mockExtractSupportingDocument
      .mockResolvedValueOnce({ amount: 90000, currency: 'USD' })
      .mockRejectedValueOnce(new Error('Gemini API timeout'))

    mockPrisma.supportingDocument.update.mockResolvedValue({})
    mockPrisma.supportingDocument.findMany.mockResolvedValue([
      { ...supportingDocs[0], extractedData: { amount: 90000, currency: 'USD' } },
      { ...supportingDocs[1], extractedData: null },
    ])
    mockGetValidator.mockReturnValue(null)
    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.discrepancyReport.create.mockResolvedValue({})

    await runValidation(transactionId)

    // Should complete (not throw), and create report with FATAL finding
    const createCall = mockPrisma.discrepancyReport.create.mock.calls[0][0]
    const findings = createCall.data.findings.create
    const fatalFinding = findings.find(
      (f: Record<string, unknown>) => f.severity === 'FATAL' && f.field === 'extraction'
    )
    expect(fatalFinding).toBeDefined()
    expect(fatalFinding.description).toContain('PACKING_LIST')
    expect(fatalFinding.supportingDocId).toBe('doc-2')

    // Status should be COMPLETED (pipeline continues)
    const updateCalls = mockPrisma.transaction.update.mock.calls
    const lastCall = updateCalls[updateCalls.length - 1]
    expect(lastCall[0].data.status).toBe('COMPLETED')
  })

  it('runs validators for documents with extracted data', async () => {
    const transactionId = 'tx-006'
    const invoiceData = { amount: 110000, currency: 'USD', date: '2024-06-15' }

    mockPrisma.transaction.findUniqueOrThrow.mockResolvedValue({
      id: transactionId,
      type: 'LC',
      sourceDocument: { reviewedFields: buildLCFields() },
      supportingDocs: [
        { id: 'doc-1', documentType: 'COMMERCIAL_INVOICE', filePath: '/path/1', mimeType: 'application/pdf', extractedData: invoiceData },
      ],
    })

    mockPrisma.supportingDocument.findMany.mockResolvedValue([
      { id: 'doc-1', documentType: 'COMMERCIAL_INVOICE', extractedData: invoiceData },
    ])

    const mockValidator = {
      validate: vi.fn().mockResolvedValue([
        {
          checkType: 'DETERMINISTIC',
          severity: 'FATAL',
          field: 'amount',
          expected: '<= 105000',
          found: '110000',
          description: 'Amount exceeds tolerance',
          regulatoryRef: 'UCP 600 Art. 14(b)',
          ragChunkIds: [],
        },
      ]),
    }
    mockGetValidator.mockReturnValue(mockValidator)
    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.discrepancyReport.create.mockResolvedValue({})

    await runValidation(transactionId)

    expect(mockValidator.validate).toHaveBeenCalledWith(
      buildLCFields(),
      invoiceData,
      'LC',
    )

    const createCall = mockPrisma.discrepancyReport.create.mock.calls[0][0]
    const findings = createCall.data.findings.create
    expect(findings).toHaveLength(1)
    expect(findings[0].supportingDocId).toBe('doc-1')
  })

  it('runs cross-document checks and includes findings', async () => {
    const transactionId = 'tx-007'

    mockPrisma.transaction.findUniqueOrThrow.mockResolvedValue({
      id: transactionId,
      type: 'LC',
      sourceDocument: { reviewedFields: buildLCFields() },
      supportingDocs: [],
    })

    mockPrisma.supportingDocument.findMany.mockResolvedValue([
      { id: 'doc-1', documentType: 'BILL_OF_LADING', extractedData: { portOfLoading: 'Jakarta' } },
      { id: 'doc-2', documentType: 'INSURANCE_CERTIFICATE', extractedData: { portOfLoading: 'Surabaya' } },
    ])

    mockGetValidator.mockReturnValue(null)
    mockRunCrossDocumentChecks.mockReturnValue([
      {
        checkType: 'CROSS_DOCUMENT',
        severity: 'MAJOR',
        field: 'portOfLoading',
        expected: 'Jakarta (from BILL_OF_LADING)',
        found: 'Surabaya (from INSURANCE_CERTIFICATE)',
        description: 'Port of loading mismatch',
        regulatoryRef: 'UCP 600 Art. 14(d)',
        ragChunkIds: [],
      },
    ])
    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.discrepancyReport.create.mockResolvedValue({})

    await runValidation(transactionId)

    const createCall = mockPrisma.discrepancyReport.create.mock.calls[0][0]
    const findings = createCall.data.findings.create
    const crossFinding = findings.find((f: Record<string, unknown>) => f.checkType === 'CROSS_DOCUMENT')
    expect(crossFinding).toBeDefined()
    expect(crossFinding.field).toBe('portOfLoading')
  })

  it('computes correct summary counts', async () => {
    const transactionId = 'tx-008'

    mockPrisma.transaction.findUniqueOrThrow.mockResolvedValue({
      id: transactionId,
      type: 'LC',
      sourceDocument: { reviewedFields: buildLCFields() },
      supportingDocs: [],
    })

    mockPrisma.supportingDocument.findMany.mockResolvedValue([
      { id: 'doc-1', documentType: 'COMMERCIAL_INVOICE', extractedData: { amount: 200000, currency: 'EUR' } },
    ])

    const mockValidator = {
      validate: vi.fn().mockResolvedValue([
        { checkType: 'DETERMINISTIC', severity: 'FATAL', field: 'amount', description: 'Over', regulatoryRef: 'X', ragChunkIds: [] },
        { checkType: 'DETERMINISTIC', severity: 'FATAL', field: 'currency', description: 'Mismatch', regulatoryRef: 'Y', ragChunkIds: [] },
        { checkType: 'DETERMINISTIC', severity: 'MINOR', field: 'date', description: 'Close', regulatoryRef: 'Z', ragChunkIds: [] },
      ]),
    }
    mockGetValidator.mockReturnValue(mockValidator)

    mockRunCrossDocumentChecks.mockReturnValue([
      { checkType: 'CROSS_DOCUMENT', severity: 'MAJOR', field: 'weight', description: 'Mismatch', regulatoryRef: 'W', ragChunkIds: [] },
    ])

    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.discrepancyReport.create.mockResolvedValue({})

    await runValidation(transactionId)

    const createCall = mockPrisma.discrepancyReport.create.mock.calls[0][0]
    expect(createCall.data.summary).toEqual({
      fatal: 2,
      major: 1,
      minor: 1,
      total: 4,
    })
  })

  it('creates discrepancy report with transactionId', async () => {
    const transactionId = 'tx-009'

    mockPrisma.transaction.findUniqueOrThrow.mockResolvedValue({
      id: transactionId,
      type: 'SKBDN',
      sourceDocument: { reviewedFields: buildLCFields() },
      supportingDocs: [],
    })
    mockPrisma.supportingDocument.findMany.mockResolvedValue([])
    mockPrisma.transaction.update.mockResolvedValue({})
    mockPrisma.discrepancyReport.create.mockResolvedValue({})

    await runValidation(transactionId)

    expect(mockPrisma.discrepancyReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          transactionId,
        }),
      })
    )
  })
})
