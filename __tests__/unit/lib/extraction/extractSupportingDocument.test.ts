import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractSupportingDocument, getDocumentPrompt } from '@/lib/extraction/extractSupportingDocument'
import { ExtractionError } from '@/lib/extraction/ExtractionError'

const mockGenerateContent = vi.fn()

// Mock the gemini module
vi.mock('@/lib/gemini', () => ({
  ai: {
    models: {
      generateContent: (...args: any[]) => mockGenerateContent(...args),
    },
  },
  VISION_MODEL: 'gemini-2.5-flash-preview-05-20',
}))

describe('extractSupportingDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockGeminiResponse(responseText: string) {
    mockGenerateContent.mockResolvedValue({
      text: responseText,
    })
  }

  function mockGeminiError(error: Error) {
    mockGenerateContent.mockRejectedValue(error)
  }

  it('should extract invoice data from a valid Gemini response', async () => {
    const mockResponse = {
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-03-15',
      seller: { name: 'PT Exporter', address: 'Jakarta' },
      buyer: { name: 'PT Importer', address: 'Singapore' },
      currency: 'USD',
      totalAmount: 95000,
      goodsDescription: 'Electronic components',
      confidence: { invoiceNumber: 0.98, totalAmount: 0.95 },
    }
    mockGeminiResponse(JSON.stringify(mockResponse))

    const result = await extractSupportingDocument(
      Buffer.from('fake-invoice-pdf'),
      'application/pdf',
      'COMMERCIAL_INVOICE'
    )

    expect(result.invoiceNumber).toBe('INV-2024-001')
    expect(result.currency).toBe('USD')
    expect(result.totalAmount).toBe(95000)
  })

  it('should use invoice prompt for COMMERCIAL_INVOICE type', async () => {
    mockGeminiResponse(JSON.stringify({ invoiceNumber: 'INV-001' }))

    await extractSupportingDocument(Buffer.from('fake'), 'application/pdf', 'COMMERCIAL_INVOICE')

    const callArgs = mockGenerateContent.mock.calls[0][0]
    const textPart = callArgs.contents[0].parts[1].text
    expect(textPart).toContain('Commercial Invoice')
  })

  it('should use bill of lading prompt for BILL_OF_LADING type', async () => {
    mockGeminiResponse(JSON.stringify({ blNumber: 'BL-001' }))

    await extractSupportingDocument(Buffer.from('fake'), 'application/pdf', 'BILL_OF_LADING')

    const callArgs = mockGenerateContent.mock.calls[0][0]
    const textPart = callArgs.contents[0].parts[1].text
    expect(textPart).toContain('Bill of Lading')
  })

  it('should use generic prompt for OTHER document type', async () => {
    mockGeminiResponse(JSON.stringify({ documentNumber: 'DOC-001' }))

    await extractSupportingDocument(Buffer.from('fake'), 'application/pdf', 'OTHER')

    const callArgs = mockGenerateContent.mock.calls[0][0]
    const textPart = callArgs.contents[0].parts[1].text
    expect(textPart).toContain('trade finance supporting document')
  })

  it('should throw ExtractionError when Gemini returns invalid JSON', async () => {
    mockGeminiResponse('invalid json response')

    try {
      await extractSupportingDocument(Buffer.from('fake'), 'application/pdf', 'COMMERCIAL_INVOICE')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError)
      expect((error as ExtractionError).message).toContain('Failed to parse Gemini response as JSON')
      expect((error as ExtractionError).code).toBe('JSON_PARSE_ERROR')
      expect((error as ExtractionError).documentType).toBe('COMMERCIAL_INVOICE')
    }
  })

  it('should throw ExtractionError when Gemini API fails', async () => {
    mockGeminiError(new Error('Network error'))

    try {
      await extractSupportingDocument(Buffer.from('fake'), 'application/pdf', 'PACKING_LIST')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError)
      expect((error as ExtractionError).message).toContain('Supporting document extraction failed')
      expect((error as ExtractionError).code).toBe('GEMINI_API_ERROR')
      expect((error as ExtractionError).documentType).toBe('PACKING_LIST')
    }
  })

  it('should include document type in error when extraction fails', async () => {
    mockGeminiError(new Error('Timeout'))

    try {
      await extractSupportingDocument(Buffer.from('fake'), 'application/pdf', 'INSURANCE_CERTIFICATE')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ExtractionError)
      expect((error as ExtractionError).documentType).toBe('INSURANCE_CERTIFICATE')
    }
  })
})

describe('getDocumentPrompt', () => {
  it('should return correct prompt for each known document type', () => {
    expect(getDocumentPrompt('COMMERCIAL_INVOICE')).toContain('Commercial Invoice')
    expect(getDocumentPrompt('PACKING_LIST')).toContain('Packing List')
    expect(getDocumentPrompt('BILL_OF_LADING')).toContain('Bill of Lading')
    expect(getDocumentPrompt('AIRWAY_BILL')).toContain('Air Waybill')
    expect(getDocumentPrompt('CERTIFICATE_OF_ORIGIN')).toContain('Certificate of Origin')
    expect(getDocumentPrompt('INSURANCE_CERTIFICATE')).toContain('Insurance Certificate')
  })

  it('should return generic prompt for unknown/other document types', () => {
    const genericTypes = [
      'BILL_OF_EXCHANGE',
      'SURAT_JALAN',
      'INSPECTION_CERTIFICATE',
      'BENEFICIARY_CERTIFICATE',
      'CERTIFICATE_OF_ANALYSIS',
      'PHYTOSANITARY_CERTIFICATE',
      'OTHER',
    ] as const

    for (const type of genericTypes) {
      expect(getDocumentPrompt(type)).toContain('trade finance supporting document')
    }
  })
})
