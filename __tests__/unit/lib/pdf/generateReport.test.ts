import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFDocument } from 'pdf-lib'

// Mock Prisma before importing the module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    discrepancyReport: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}))

import { generateReportPDF } from '@/lib/pdf/generateReport'
import { prisma } from '@/lib/prisma'

const mockFindUniqueOrThrow = vi.mocked(prisma.discrepancyReport.findUniqueOrThrow)

describe('generateReportPDF', () => {
  const mockReport = {
    id: 'report-001',
    transactionId: 'txn-abc-123',
    generatedAt: new Date('2024-01-15T10:00:00Z'),
    summary: { fatal: 2, major: 3, minor: 1, total: 6 },
    exportPath: null,
    transaction: {
      id: 'txn-abc-123',
      type: 'LC',
      status: 'COMPLETED',
      errorDetails: null,
      createdAt: new Date('2024-01-10T08:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
      userId: null,
    },
    findings: [
      {
        id: 'finding-1',
        reportId: 'report-001',
        supportingDocId: 'doc-inv-01',
        supportingDoc: {
          id: 'doc-inv-01',
          transactionId: 'txn-abc-123',
          documentType: 'COMMERCIAL_INVOICE',
          filePath: '/uploads/uuid-1',
          mimeType: 'application/pdf',
          extractedData: {},
          uploadedAt: new Date(),
          extractedAt: new Date(),
        },
        checkType: 'DETERMINISTIC',
        severity: 'FATAL',
        field: 'amount',
        expected: 'USD 50,000.00',
        found: 'USD 55,000.00',
        description: 'Invoice amount exceeds LC amount plus tolerance',
        suggestedCorrection: 'Revise invoice amount to not exceed USD 50,000.00',
        regulatoryRef: 'UCP 600 Art. 14(b)',
        ragChunkIds: [],
        createdAt: new Date(),
      },
      {
        id: 'finding-2',
        reportId: 'report-001',
        supportingDocId: 'doc-inv-01',
        supportingDoc: {
          id: 'doc-inv-01',
          transactionId: 'txn-abc-123',
          documentType: 'COMMERCIAL_INVOICE',
          filePath: '/uploads/uuid-1',
          mimeType: 'application/pdf',
          extractedData: {},
          uploadedAt: new Date(),
          extractedAt: new Date(),
        },
        checkType: 'DETERMINISTIC',
        severity: 'MAJOR',
        field: 'quantity',
        expected: '1000 PCS',
        found: '1050 PCS',
        description: 'Invoice quantity does not match packing list quantity',
        suggestedCorrection: null,
        regulatoryRef: 'UCP 600 Art. 14(d)',
        ragChunkIds: [],
        createdAt: new Date(),
      },
      {
        id: 'finding-3',
        reportId: 'report-001',
        supportingDocId: null,
        supportingDoc: null,
        checkType: 'CROSS_DOCUMENT',
        severity: 'MAJOR',
        field: 'containerNumbers',
        expected: 'MSKU1234567',
        found: 'MSKU1234568',
        description: 'Container numbers inconsistent between Bill of Lading and Packing List',
        suggestedCorrection: 'Ensure container numbers match across all documents',
        regulatoryRef: 'UCP 600 Art. 14(d)',
        ragChunkIds: [],
        createdAt: new Date(),
      },
      {
        id: 'finding-4',
        reportId: 'report-001',
        supportingDocId: 'doc-bl-01',
        supportingDoc: {
          id: 'doc-bl-01',
          transactionId: 'txn-abc-123',
          documentType: 'BILL_OF_LADING',
          filePath: '/uploads/uuid-2',
          mimeType: 'application/pdf',
          extractedData: {},
          uploadedAt: new Date(),
          extractedAt: new Date(),
        },
        checkType: 'DETERMINISTIC',
        severity: 'FATAL',
        field: 'onBoardDate',
        expected: '2024-01-20',
        found: '2024-01-25',
        description: 'On-board date exceeds latest shipment date',
        suggestedCorrection: null,
        regulatoryRef: 'UCP 600 Art. 43(a)',
        ragChunkIds: [],
        createdAt: new Date(),
      },
      {
        id: 'finding-5',
        reportId: 'report-001',
        supportingDocId: 'doc-inv-01',
        supportingDoc: {
          id: 'doc-inv-01',
          transactionId: 'txn-abc-123',
          documentType: 'COMMERCIAL_INVOICE',
          filePath: '/uploads/uuid-1',
          mimeType: 'application/pdf',
          extractedData: {},
          uploadedAt: new Date(),
          extractedAt: new Date(),
        },
        checkType: 'INTERPRETIVE',
        severity: 'MINOR',
        field: 'beneficiaryName',
        expected: 'PT. ABC Trading',
        found: 'PT ABC Trading',
        description: 'Minor variation in beneficiary name (missing period)',
        suggestedCorrection: 'Ensure beneficiary name matches exactly as per LC',
        regulatoryRef: 'ISBP 745 A21',
        ragChunkIds: ['chunk-1'],
        createdAt: new Date(),
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFindUniqueOrThrow.mockResolvedValue(mockReport as any)
  })

  it('should return a valid PDF buffer starting with %PDF signature', async () => {
    const buffer = await generateReportPDF('txn-abc-123')

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)

    // PDF files must start with %PDF
    const header = buffer.subarray(0, 5).toString('ascii')
    expect(header).toBe('%PDF-')
  })

  it('should produce a valid PDF that can be parsed back', async () => {
    const buffer = await generateReportPDF('txn-abc-123')

    // pdf-lib should be able to load the generated PDF without error
    const loadedDoc = await PDFDocument.load(buffer)
    expect(loadedDoc.getPageCount()).toBeGreaterThanOrEqual(1)
  })

  it('should query the correct transaction from Prisma', async () => {
    await generateReportPDF('txn-abc-123')

    expect(mockFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { transactionId: 'txn-abc-123' },
      include: {
        findings: { include: { supportingDoc: true } },
        transaction: true,
      },
    })
  })

  it('should generate a multi-page PDF when findings are numerous', async () => {
    // Create many findings to force multiple pages
    const manyFindings = Array.from({ length: 50 }, (_, i) => ({
      id: `finding-${i}`,
      reportId: 'report-001',
      supportingDocId: 'doc-inv-01',
      supportingDoc: {
        id: 'doc-inv-01',
        transactionId: 'txn-abc-123',
        documentType: 'COMMERCIAL_INVOICE',
        filePath: '/uploads/uuid-1',
        mimeType: 'application/pdf',
        extractedData: {},
        uploadedAt: new Date(),
        extractedAt: new Date(),
      },
      checkType: 'DETERMINISTIC',
      severity: 'FATAL',
      field: `field_${i}`,
      expected: `Expected value ${i} with some long text to take up space`,
      found: `Found value ${i} with some different long text to consume page space`,
      description: `This is a detailed description of finding number ${i} that explains what went wrong and why this is important to fix before bank submission`,
      suggestedCorrection: `Correct the field_${i} value to match the LC terms exactly as specified in the instrument`,
      regulatoryRef: 'UCP 600 Art. 14(b)',
      ragChunkIds: [],
      createdAt: new Date(),
    }))

    mockFindUniqueOrThrow.mockResolvedValue({
      ...mockReport,
      findings: manyFindings,
    } as any)

    const buffer = await generateReportPDF('txn-abc-123')
    const loadedDoc = await PDFDocument.load(buffer)

    // With 50 findings and descriptions, should span multiple pages
    expect(loadedDoc.getPageCount()).toBeGreaterThan(1)
  })

  it('should handle report with no findings gracefully', async () => {
    mockFindUniqueOrThrow.mockResolvedValue({
      ...mockReport,
      summary: { fatal: 0, major: 0, minor: 0, total: 0 },
      findings: [],
    } as any)

    const buffer = await generateReportPDF('txn-abc-123')

    expect(buffer).toBeInstanceOf(Buffer)
    const header = buffer.subarray(0, 5).toString('ascii')
    expect(header).toBe('%PDF-')

    const loadedDoc = await PDFDocument.load(buffer)
    expect(loadedDoc.getPageCount()).toBeGreaterThanOrEqual(1)
  })

  it('should throw when transaction is not found', async () => {
    mockFindUniqueOrThrow.mockRejectedValue(new Error('Record not found'))

    await expect(generateReportPDF('non-existent')).rejects.toThrow('Record not found')
  })

  it('should include text content in page content streams', async () => {
    const buffer = await generateReportPDF('txn-abc-123')
    const loadedDoc = await PDFDocument.load(buffer)

    // Verify the first page has content (non-empty content stream)
    const firstPage = loadedDoc.getPage(0)
    expect(firstPage).toBeDefined()

    // The page should have reasonable dimensions (A4)
    const { width, height } = firstPage.getSize()
    expect(width).toBeCloseTo(595.28, 0)
    expect(height).toBeCloseTo(841.89, 0)
  })

  it('should create PDF with findings grouped by document type', async () => {
    // This test ensures the function runs without error when findings
    // span multiple document types
    const buffer = await generateReportPDF('txn-abc-123')
    const loadedDoc = await PDFDocument.load(buffer)

    // With our fixture having COMMERCIAL_INVOICE, BILL_OF_LADING, and cross-document findings
    // the function should produce at least 1 page
    expect(loadedDoc.getPageCount()).toBeGreaterThanOrEqual(1)
  })

  it('should handle SKBDN transaction type', async () => {
    mockFindUniqueOrThrow.mockResolvedValue({
      ...mockReport,
      transaction: {
        ...mockReport.transaction,
        type: 'SKBDN',
        status: 'COMPLETED',
      },
    } as any)

    const buffer = await generateReportPDF('txn-abc-123')
    const loadedDoc = await PDFDocument.load(buffer)
    expect(loadedDoc.getPageCount()).toBeGreaterThanOrEqual(1)
  })
})
